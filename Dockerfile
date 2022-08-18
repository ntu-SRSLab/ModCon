FROM ubuntu:bionic

Run mkdir -p /home/modcon 

WORKDIR /home/modcon

# Copy ModCon 
COPY app      /home/modcon/app
COPY server   /home/modcon/server
COPY ethereum  /home/modcon/ethereum
COPY fisco-bcos  /home/modcon/fisco-bcos
COPY bootstrap.sh /home/modcon/

RUN apt update && apt install -y wget nodejs npm &&\
npm i -g n && n latest
RUN npm i -g npm@6.14.4 && apt install -y git

RUN apt install python3-pip

CMD ["bash", "bootstrap.sh"]
