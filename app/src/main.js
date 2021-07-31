import Vue from "vue";
import App from "./App.vue";
import Smcat from "state-machine-cat"
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import Popper from 'popper.js'
import SocketIO from "socket.io-client"
import SocketIOFileUpload from 'socketio-file-upload'
import FSMService from "./service/service.js"
import VueCodemirror from 'vue-codemirror'
import JsonCSV from 'vue-json-csv'
 
import assert from "assert"


// import base style

const fsmservice = new FSMService();
Popper.Defaults.modifiers.computeStyle.gpuAcceleration = false
global.Popper = Popper;
global.vm = vm; //Define you app variable globally

var myArgs = process.argv.slice(2);
var SocketInstance = SocketIO('http://127.0.0.1:3000', {
  reconnection: true,
  reconnectionDelay: 3000
});
if (myArgs.length>0){
  assert(myArgs.length==1);
  var server = myArgs[0];
  SocketInstance = SocketIO(server, {
    reconnection: true,
    reconnectionDelay: 3000
  });
}
var uploader = new SocketIOFileUpload(SocketInstance);

Vue.prototype.$fsmservice = fsmservice;
Vue.prototype.$uploader = uploader;
Vue.prototype.$socket = SocketInstance;
Vue.prototype.$smcat = Smcat;

Vue.component('downloadCsv', JsonCSV)
Vue.use(VueCodemirror);
// Install BootstrapVue
Vue.use(BootstrapVue);
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin);
Vue.config.productionTip = false;

var vm =new Vue({   
  render: h => h(App)
}).$mount("#app");
