# Hugging Face Spaces (Docker SDK, free "CPU basic": 2 vCPU, 16 GB RAM).
# Built from the repository root by deploy/huggingface/deploy.sh.
FROM python:3.12-slim

RUN useradd -m -u 1000 user
WORKDIR /home/user/app
COPY --chown=user server/requirements.txt server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt

USER user
ENV HOME=/home/user \
    HF_HOME=/home/user/.cache/huggingface \
    WHISPER_MODEL=small.en \
    PIPER_VOICE=en_US-lessac-medium \
    PIPER_DIR=/home/user/voices

# Bake the models into the image so a Space waking from sleep doesn't download them again.
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('small.en', device='cpu', compute_type='int8')"
RUN python -c "from pathlib import Path; from piper.download_voices import download_voice; p = Path('/home/user/voices'); p.mkdir(parents=True, exist_ok=True); download_voice('en_US-lessac-medium', p)"

COPY --chown=user server/ server/
COPY --chown=user public/ public/

EXPOSE 7860
CMD ["uvicorn", "server.app:app", "--host", "0.0.0.0", "--port", "7860"]
