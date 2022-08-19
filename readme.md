# ModCon: A Model-Based Testing Platform for Smart Contracts

ModCon is a model-based testing platform, relying on user-specified models to define test oracles, guide test generation, and measure test adequacy. ModCon is Web-based and supports both permissionless and permissioned blockchain platforms.

### Quick Start
* Pull the docker images 
```bash
docker pull liuyedocker/ntu-srslab-modcon:v1.0
```

* Run the docker images
```bash
docker run -it -p 8080:8080 -p 3000:3000 liuyedocker/ntusrslab-modcon:v1.0
```
   The ModCon website application can be assessed on: http://localhost:8080/.
### Get Started
* Clone the repository into your local machine.

```bash
git clone git@github.com:ntu-SRSLab/ModCon.git
cd ModCon
```
* Run the back-end server of ModCon.
    ```bash
    cd ./server && npm install && node server.js
    ```
    The server would be listening on 3000 port.
    
* Run the front-end app of ModCon.
   ```bash
   cd ./app && npm install && npm run serve
   ```
   The ModCon website application can be assessed on: http://localhost:8080/.

### User Guide

We had shared a Demo video on YouTube about [ModCon](https://youtu.be/vcYM3iX-pj8), where you can learn the basic workflow of ModCon.

If you have any question, please contact us.

### Contacts

| Names         | Emails                   | GitHub IDs     |
|---------------|--------------------------|----------------|
| Ye   Liu      | li0003ye@e.ntu.edu.sg    | Franklinliu    | 
| Yi    Li      | yi_li@ntu.edu.sg         | liyistc        |
| Shang-Wei Lin | shang-wei.lin@ntu.edu.sg | shangweilin    |       

If you would like to use ModCon in your research, please cite our FSE'20 paper:
```tex
@inproceedings{Liu2020MAM,
  author = {Liu, Ye and Li, Yi and Lin, Shang-Wei and Yan, Qiang},
  booktitle = {Proceedings of the 28th ACM Joint European Software Engineering Conference and Symposium on the Foundations of Software Engineering (FSE)},
  month = nov,
  title = {{ModCon}: A Model-Based Testing Platform for Smart Contracts},
  year = {2020}
}
```
