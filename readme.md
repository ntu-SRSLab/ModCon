# ModCon: A Model-Based Testing Platform for Smart Contracts

ModCon is a model-based testing platform, relying on user-specified models to define test oracles, guide test generation, and measure test adequacy.  ModCon is Web-based and supports both permissionless and permissioned blockchain platforms.

### Get Started
* Clone the repository  into your local machine.
```bash
    git clone git@github.com:ntu-SRSLab/ModCon.git
    cd ModCon
```
* Run any one of Ethereum clients (including Geth and Aleth)
    * Start the Geth client.
    ```bash
    cd  ./ethereum/geth-ethereum 
    sudo sh ./runEthereum.sh
    ```
    * Start the Aleth client.
    ```bash
    cd ./ethereum/aleth-ethereum 
    sudo  sh ./runAleth.sh & 
    sudo sh ./bootstrap.sh
    ```
 * Run the back-end server of ModCon.
    ```bash
    cd ./server && npm install && node server.js
    ```
    The server would be listening on 3000 port.
    
 * Run the front-end app of ModCon.
   ```bash
   cd  ./app  && npm install && npm run serve
   ```
   The ModCon website application can be assessed on http://localhost:8080/.

### User Guide

We had shared a demo vedio on Youtube about [ModCon](https://youtu.be/vcYM3iX-pj8), where you can learn the basic workflow of ModCon.

If you have any question, please contact us.

### Contacts

| Names         | Emails                   | GitHub IDs     |
|---------------|--------------------------|----------------|
| Ye   Liu        | li0003ye@e.ntu.edu.sg      | Franklinliu    | 
| Yi    Li         | yi_li@ntu.edu.sg         | liyistc        |
| Shang-Wei Lin | shang-wei.lin@ntu.edu.sg | shangweilin|       
