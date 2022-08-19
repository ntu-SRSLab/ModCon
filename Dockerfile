FROM ubuntu:bionic

RUN mkdir -p /home/modcon 

WORKDIR /home/modcon

RUN apt update && apt install -y wget nodejs npm git curl 
RUN npm i -g n && n --preserve 15.5.0
RUN npm i -g npm@6.14.4 

# Copy ModCon 
COPY app      /home/modcon/app
COPY server   /home/modcon/server
COPY ethereum  /home/modcon/ethereum
COPY fisco-bcos  /home/modcon/fisco-bcos
COPY bootstrap.sh /home/modcon/

RUN cd /home/modcon/server && npm install
RUN cd /home/modcon/app && npm install

CMD ["bash", "bootstrap.sh"]
