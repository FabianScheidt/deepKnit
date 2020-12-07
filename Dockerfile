# Build Angular Frontend
FROM node:10 as node
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json /app/
RUN npm install
COPY ./frontend /app/
RUN npm run build

# Execute in Python environment
FROM python:3.6
WORKDIR /app
COPY model-server/requirements.txt /app/
RUN pip3 install -r requirements.txt
COPY --from=node /app/dist/knitpaint-frontend /app/static
COPY model-server/src /app/src
COPY model-server/data /app/data
COPY model-server/output /app/output
WORKDIR /app/src
CMD python3 server.py
