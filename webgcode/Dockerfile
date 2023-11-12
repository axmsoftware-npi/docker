FROM nginx:latest

RUN apt update &&\
    apt install -y git &&\
    rm -rf /usr/share/nginx/html/* &&\
    git clone https://github.com/nraynaud/webgcode.git /usr/share/nginx/html/
