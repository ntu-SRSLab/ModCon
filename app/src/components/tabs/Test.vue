<template>
  <b-container fluid>
    <b-row>
      <b-col align-v="center" cols="5"  :md="2">
        <b-container >
        <b-form inline>
          <span class = "secondary mt-2 mr-2" >Specification </span>
          <b-form-group  class="mt-2"  id="fieldset-1"
      label="example:"
      label-for="select_example">
            <b-form-select id="select_example"  v-model="selected" :options="options" @change="OnSelectExample"></b-form-select>
          </b-form-group>
        </b-form>
        </b-container>
        <!-- style="width:100%; height: 820px; border:thin;" -->
          <b-container  id="FSMContainer" :class = "zoom"  @mouseover="OnMouseOverFSM"  @mouseleave="OnMouseOutFSM"   >
                 <codemirror  class="MyCodeMirror" id="fsm"  v-model="fsm"   :options="cmOptions_json" @change="OnStateMachineChange"  />
          </b-container>
      </b-col>
      <b-col align-v="center" cols="5"  :md="5">
         <span class = "secondary mt-2 mr-2" >Control Panel </span>
        <b-row  v-show="!mouseOverFSM" >
              <div v-if = "fsm" class="container"  style="width:100%; height: 350px; border:solid thin;"  v-html="lSVGInAString">
              </div>
        </b-row>
        <b-row v-if="lSVGInAString "  v-show="!mouseOverFSM" >
        <div class="container" style="width: 100%; height:450px">
          <b-row>
              <b-col>
               <b-form-group  class="align-baseline text-left" label="Strategy" >
                  <b-form-radio-group id="strategy-radio-group" v-model="covering_strategy" name="strategy-radios"  @input="OnCoverStrategy" stacked>
                      <b-form-radio   class="text-left mr-3"  value="States"   >Cover State</b-form-radio>
                      <b-form-radio   class="text-left mr-5"  value="Transitions-Without-Loop"     >Cover Transition</b-form-radio>
                      <b-form-radio   class="text-left mr-5"   value="Transitions-With-Loop"     >Cover Transition (Loop)</b-form-radio>
                  </b-form-radio-group>   
                </b-form-group>
              </b-col>
              <b-col>
               <b-form-group  class="text-left" label="Test Case Priority on State/Transition" >
                 <b-form inline class="mt-2 mb-2">
                  <label class="mr-sm-2" for="inline-form-custom-select-state">State: </label>
                  <b-form-select id="inline-form-custom-select-state" v-model="selected_state" :options="states"
                    class="mb-2 mr-sm-2 mb-sm-0 col-sm-2" ></b-form-select>
                 </b-form>
                 <b-form inline  class="mt-2 mb-2">
                     <label class="mr-sm-2">Transition: </label>
                       <b-form-select v-model="selected_transition_startstate" :options="states" @change="OnTransitions"
                                class="mb-2 mr-sm-2 mb-sm-0 col-sm-2" ></b-form-select>
                        <span> --> </span>
                        <b-form-select v-model="selected_transition"  :options="transitions"
                                class="mb-2 mr-sm-2 mb-sm-0  col-sm-2" ></b-form-select>
                 </b-form> 
               
                </b-form-group>
              </b-col>
          </b-row>
            <b-form inline>
                        <b-form-checkbox
                          id="checkbox-1"
                          class = "mr-3 mb-2"
                          v-model="fsm_status"
                          name="checkbox-1"
                          value="confirmed"
                          unchecked-value="not_confirmed"
                        >
                              Confirm specication
                       </b-form-checkbox>
                       <b-form-checkbox
                                id="checkbox-2"
                                class = "mr-3 mb-2"
                                v-model="model_status"
                                name="checkbox-2"
                                value="confirmed"
                                unchecked-value="not_confirmed"
                              >
                              Confirm model driver
                    </b-form-checkbox>
                    <b-form-checkbox v-model="chooseRandom"  class = "mr-3 mb-2" name="check-button" @input="OnChooseRandomTest" switch>
                         <span>{{chooseRandom?"Random":"Model Based"}}</span>
                    </b-form-checkbox>
                    <b-button :disabled ="disableTest"  class="ml-2   mb-2 col-sm-2"   size="md" :variant="variantTest" @click="OnTest">
                             <span>{{!isTestStart?"Test":"Stop"}}</span>
                             <!-- <span>disableTest</span> -->
                              <b-spinner small v-if = "status_stop_start&&isTestStart"></b-spinner>
                    </b-button>
                    <b-button class="ml-2   mb-2 col-sm-2"   size="md" :variant="variantTest" @click="OnLearn">
                             <span>Learn</span> 
                    </b-button>
<!--                      
                    <b-button :disabled ="disableRandomTest"  class="ml-2   mb-2 col-sm-2"   size="md" :variant="variantRandomTest" @click="OnRandomTest()">
                       <span>{{textRandomTestButton}}</span>
                       <b-spinner small   v-if = "status_stop_start&&disabledTest"></b-spinner>
                    </b-button> -->
                    
                     <download-csv
                                    v-if = "test_results.length>0"
                                    :data   = "test_results">
                                     <b-button  class="ml-2   mb-2 "   size="md"  variant="secondary"  >
                                          <b-icon icon="download" aria-hidden="true"></b-icon> 
                                          <!-- export table -->
                                            (.csv)
                                    </b-button>
                      </download-csv>
                        <b-button    v-if = "test_results.length>0" class="ml-2   mb-2 "   size="md"  variant="secondary"  @click="OnClearTable" > clear  </b-button>
            </b-form>
             <b-table outlined=true  sticky-header=true hover :items="test_results"></b-table>
          </div>
        </b-row>

      </b-col>
      <b-col  cols="6"  md="5">
           <span class = "secondary mt-2 mr-2" > Model Driver </span>
          <b-container  class ="normal"  >
                 <codemirror   class="ModelCodeMirror" v-model="model"  :options="cmOptions"  />
          </b-container> 
      </b-col>
      
    
    </b-row>
  </b-container>
</template>


<script>
  
  import dedent from 'dedent'
  
  import stringify from "json-stringify-pretty-compact"

// base style
  import 'codemirror/lib/codemirror.css'

  // theme css
  import 'codemirror/theme/monokai.css'
  import 'codemirror/theme/solarized.css'
  // language
  import 'codemirror/mode/vue/vue.js'

  // active-line.js
  import 'codemirror/addon/selection/active-line.js'

  // styleSelectedText
  import 'codemirror/addon/selection/mark-selection.js'
  import 'codemirror/addon/search/searchcursor.js'

  // highlightSelectionMatches
  import 'codemirror/addon/scroll/annotatescrollbar.js'
  import 'codemirror/addon/search/matchesonscrollbar.js'
  import 'codemirror/addon/search/searchcursor.js'
  import 'codemirror/addon/search/match-highlighter.js'

  // keyMap
  import 'codemirror/mode/clike/clike.js'
  import 'codemirror/addon/edit/matchbrackets.js'
  import 'codemirror/addon/comment/comment.js'
  import 'codemirror/addon/dialog/dialog.js'
  import 'codemirror/addon/dialog/dialog.css'
  import 'codemirror/addon/search/searchcursor.js'
  import 'codemirror/addon/search/search.js'
  import 'codemirror/keymap/sublime.js'

  // foldGutter
  import 'codemirror/addon/fold/foldgutter.css'
  import 'codemirror/addon/fold/brace-fold.js'
  import 'codemirror/addon/fold/comment-fold.js'
  import 'codemirror/addon/fold/foldcode.js'
  import 'codemirror/addon/fold/foldgutter.js'
  import 'codemirror/addon/fold/indent-fold.js'
  import 'codemirror/addon/fold/markdown-fold.js'
  import 'codemirror/addon/fold/xml-fold.js'

  import credit from '../../assets/wecredit.json'
  import blindAction from '../../assets/blindAuction.json'
  import stateMachine from '../../assets/stateMachine.json'
  import betting  from '../../assets/betting-simple.json'
  import assetTransfer  from '../../assets/assetTransfer.json'
  import refrigeratedTransportation  from '../../assets/refrigeratedTransportation.json'

  const RandomTestLimit = 50;
  var counter = 0;
  export default {
    name: "ModelTest",
    data: function () {
      return {
        fsm: null,
        status_fsm: false,
        status_fsm_change: false,

       selected: null, 

        fsm_status:"not_confirmed",
        model_status: "not_confirmed",
        chooseRandom: false,
        lSVGInAString: null,

        mouseOverFSM: false, // if mouse over fsm box
        status_test: false,  // if test completed
        status_randomtest: false, // if random test finished
        covering_strategy: null, // which covering strategy  is selected
        
      disabledTest: false,
      disabledRandomTest: false,

      textTestButton: "Test",
      textRandomTestButton: "Random Test",

      status_stop_start: false,

      isTestStart: false,
      
        // test case priority
        states: [
          {value: 'null', text: "null"}
        ],
        selected_state: null, 
        selected_transition_startstate: null, 
        transitions: null,
        selected_transition: null, 

         log: "<p>this is the place to show running log </p>" + this.$smcat,
         test_results: [],
         test_priority: {}, 
          options: [
          { value:  credit, text: 'credit' },
          { value:  betting, text: 'betting' },
          { value: blindAction, text: 'blindAction' },
          { value: assetTransfer, text: 'assetTransfer' },
          { value:  stateMachine, text: 'stateMachine' },
          { value:  refrigeratedTransportation, text: 'refrigeratedTransportation' },
          { value:  "Write your specication here", text: 'empty' }
        ],
       cmOptions_json: {
          mode: {
              name: "javascript",
              json: true,
              statementIndent: 2
          },
          viewportMargin: Infinity,
          tabSize: 4,
          styleActiveLine: true,
          lineNumbers: true,
          line: true,
          foldGutter: true,
          styleSelectedText: true,
          keyMap: "sublime",
          matchBrackets: true,
          showCursorWhenSelecting: true,
          theme: "default",
          extraKeys: { "Ctrl": "autocomplete" },
          hintOptions:{
            completeSingle: false
          }
        },
        cmOptions: {
          mode: 'text/javascript',
          viewportMargin: Infinity,
          tabSize: 4,
          styleActiveLine: true,
          lineNumbers: true,
          line: true,
          foldGutter: true,
          styleSelectedText: true,
          keyMap: "sublime",
          matchBrackets: true,
          showCursorWhenSelecting: true,
          theme: "default",
          extraKeys: { "Ctrl": "autocomplete" },
          hintOptions:{
            completeSingle: false
          }
        }
      };
    },
    created: function(){
      let obj = this;
      const event_Test = "Test";
      this.$socket.on(event_Test, data=> {
        console.log(event_Test, data);
      } )
      this.$socket.on("server", data =>{
          //  alert(JSON.stringify(data));
           console.log(JSON.stringify(data));
           if(data.event=="event_Test_Done"){
                          obj.status_test = true;
                          console.log(data);
                          return;
              }else if (data.event == "RandomTestAction_Report"){
                          console.log(data.event);
              }
              // obj.$fsmservice.add_action_report(data.data)
           
               const lSVGInAString = obj.$smcat.render(
                                                                 obj.$fsmservice.add_action_report(data.data).get_sm_cat(), 
                                                                       {
                                                                           inputType: "json",
                                                                           outputType: "svg",
                                                                           direction: "left-right",
                                                                         }
                   ); 
                 var result = obj.$fsmservice.next_result();
                 if(result){
                       obj.test_results.push(result);
                 }
                 var  parser = new DOMParser();
                 var xmlDoc = parser.parseFromString(lSVGInAString, "text/xml");
                 // console.log(xmlDoc);
                 xmlDoc.getElementsByTagName("svg")[0].setAttribute("width", "100%");
                 xmlDoc.getElementsByTagName("svg")[0].setAttribute("height", "100%");
                 var s = new XMLSerializer();
                 obj.lSVGInAString= s.serializeToString(xmlDoc);
      });

      this.$socket.on("server-stop", data =>{
          console.log("server stopped:", data);
          obj.status_stop_start = false;
          obj.isTestStart  = false;
          if(obj.chooseRandom){
                  counter++;
                  if (counter<RandomTestLimit){
                    console.log("next random test...");
                    console.log("next random test done.");
                  }
          }
      });
    },
    methods: {
      GenerateSVGXMLString(sm_cat_json){
              const lSVGInAString = this.$smcat.render(
                sm_cat_json
                , {
                    inputType: "json",
                    outputType: "svg",
                    direction: "left-right",
                  }
                );
                // console.log(lSVGInAString);
                var  parser = new DOMParser();
                var xmlDoc = parser.parseFromString(lSVGInAString, "text/xml");
                // console.log(xmlDoc);
                xmlDoc.getElementsByTagName("svg")[0].setAttribute("width", "100%");
                xmlDoc.getElementsByTagName("svg")[0].setAttribute("height", "100%");
                var s = new XMLSerializer();
                this.lSVGInAString= s.serializeToString(xmlDoc);
      },
      OnSelectExample(){
        if(this.selected!="null"){
              this.fsm = stringify(this.selected);
              try {
                    this.GenerateSVGXMLString( this.$fsmservice.add_fsm(this.fsm).get_sm_cat());
                    this.states = this.$fsmservice.get_stateOptions();
                    this.status_fsm = true;
                    this.model =  dedent(`${this.$fsmservice.get_model_script()}`);
                    console.log(this.model);
              } catch (pError) {
                  if(pError.toString().indexOf("abi")!=-1){
                        alert( "The application has not been deployed before." );
                  }
                // alert(pError);
                   console.error(pError);
              }
        }else{
           this.fsm = null;
           this.model = null;
        }
      },
      OnStateMachineChange() {
        if(this.fsm){
            console.log("OnStateMachineChange");
            try {
              this.GenerateSVGXMLString( this.$fsmservice.add_fsm(this.fsm).get_sm_cat());
              this.states = this.$fsmservice.get_stateOptions();
              this.status_fsm = true;
              this.model =  dedent(this.$fsmservice.get_model_script());
              this.status_test = false;
            } catch (pError) {
                 console.error(pError);
                  if(pError.toString().indexOf("abi")!=-1){
                        alert( "The application has not been deployed before." );
                  }
                 
            }
        }
      },
      OnLearn(){
        const client_Learn = "Learn_client";
        console.log(client_Learn);
        this.$socket.emit("client",{type: client_Learn,
                  data: {
                        target_contract:t