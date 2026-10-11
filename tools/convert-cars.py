"""Turn the reference photos in tools/photos/ into 3D models (tools/photo-models/<car>.glb).

The site does not use these automatically. To try one on the site, copy it to
public/models/ and add the car id to PHOTO_CARS in src/three/models.js.

Uses Microsoft's free TRELLIS.2 demo on Hugging Face (high-resolution geometry and
PBR textures). The free GPU quota allows roughly one or two cars a day; run this again
later and it carries on with whatever is not yet converted at high quality.
Optional: set HF_TOKEN (free account at huggingface.co/settings/tokens) for more quota.
"""
import json, os, shutil, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTOS = os.path.join(ROOT, 'tools', 'photos')
MODELS = os.path.join(ROOT, 'tools', 'photo-models')
DONE = os.path.join(ROOT, 'tools', 'converted.json')  # cars already done with TRELLIS.2
CARS = ['rolls-royce', 'mg', 'morgan', 'marry']

try:
    from gradio_client import Client, handle_file
except ImportError:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'gradio_client'])
    from gradio_client import Client, handle_file


def npx(*args):
    subprocess.check_call(['npx', '--yes', '@gltf-transform/cli', *args], shell=os.name == 'nt')


def pack(src, dst):
    """Compress geometry (lossless meshopt) and textures (near-lossless webp). No simplification."""
    tmp = dst + '.tmp.glb'
    try:
        npx('meshopt', src, tmp)
        npx('webp', tmp, dst, '--quality', '95')
    except Exception as e:
        print('  (packing skipped:', e, ')')
        shutil.copy(src, dst)
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


def convert(car, resolution):
    client = Client('microsoft/TRELLIS.2', hf_token=os.environ.get('HF_TOKEN') or None)
    client.predict(api_name='/start_session')
    pre = client.predict(handle_file(os.path.join(PHOTOS, f'{car}.png')), api_name='/preprocess_image')
    client.predict(handle_file(pre), 0, resolution, api_name='/image_to_3d')
    glb = client.predict(200000, 2048, api_name='/extract_glb')
    glb = glb[0] if isinstance(glb, (list, tuple)) else glb
    if isinstance(glb, dict):
        glb = glb.get('value') or glb.get('path')
    raw = os.path.join(MODELS, f'{car}.raw.glb')
    shutil.copy(glb, raw)
    pack(raw, os.path.join(MODELS, f'{car}.glb'))
    os.remove(raw)


def main():
    os.makedirs(MODELS, exist_ok=True)
    done = json.load(open(DONE)) if os.path.exists(DONE) else []
    todo = [c for c in CARS if c not in done]
    if not todo:
        print('All four cars are converted at high quality.')
        return
    for car in todo:
        print(f'Converting {car} with TRELLIS.2 ... (3-6 minutes)')
        for resolution in ('1536', '1024'):
            try:
                t = time.time()
                convert(car, resolution)
                done.append(car)
                json.dump(done, open(DONE, 'w'))
                print(f'  done at {resolution} in {time.time() - t:.0f}s')
                break
            except Exception as e:
                msg = str(e)
                if 'quota' in msg.lower():
                    print('  Free GPU quota used up for today. Run this again tomorrow to continue.')
                    print('  ', msg[:200])
                    return
                print(f'  {resolution} failed: {msg[:200]}')
                time.sleep(5)


if __name__ == '__main__':
    main()
