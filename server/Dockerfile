FROM python:3.12-slim
WORKDIR /app
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY server/ server/
COPY public/ public/
ENV WHISPER_MODEL=small.en \
    HF_HOME=/models
VOLUME /models
EXPOSE 8000
CMD ["uvicorn", "server.app:app", "--host", "0.0.0.0", "--port", "8000"]
