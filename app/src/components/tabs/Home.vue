<template>
  <div class="container">
    <b-card class="mt-3" header="ModCon: The Model-based Testing Platforms for Smart Contract."  header-class= "lg"   header-bg-variant="light" header-text-variant="default">
      <b-form>
        <!-- <span> current network:{{$fsmservice.network}} </span> -->
        <b-form-group id="input-group-1" label-align="left" label="Contracts(.sol):" label-for="input-select-upload"
          description="We'll never share your software asset with anyone else.">
          <b-form-file id="input-select-upload" v-model="files" :state="Boolean(file)" accetpt=".sol"
            placeholder="Choose smart contract or drop it here..." drop-placeholder="Drop file here..."
            @change="onFileChange" multiple>
          </b-form-file>
        </b-form-group>
        <b-progress :value="value*100/files.length" variant="success" v-if="status_upload_start"></b-progress>
        <!-- <b-table striped hover :items="selected"></b-table> -->
        <b-button :variant="variant_upload" :disabled="disable_upload" @click="OnUpload" class=" mr-1"> 
                <b-icon   icon="cloud-upload" scale="1" aria-hidden="true"> </b-icon>
                <span> Upload </span>
        </b-button>
        <!-- <b-table striped hover :items="uploaded"></b-table> -->
        <b-button :variant="variant_compile" :disabled="disable_compile" @click="OnCompile" class="mr-1"> 
                <span>Compile</span>
                <b-icon   icon="check2" v-if="status_compile"> </b-icon>
                <b-spinner small   v-if = "status_compile_start"></b-spinner>
          <!-- Compile -->
        </b-button>
        <!-- <b-table striped hover :items="compiled"></b-table> -->
        <b-form class="mt-3" inline v-if="status_compile">
          <label class="mr-sm-2" for="inline-form-custom-select-contract">contract </label>
          <b-form-select id="inline-form-custom-select-contract" v-model="selected_contract" :options="contracts"
            class="mb-2 mr-sm-2 mb-sm-0" @change="OnSelectContract"></b-form-select>

          <label v-if="selected_contract" class="mr-sm-2" for="inline-form-custom-select-contract-address">address
          </label>
          <b-form-select id="inline-form-custom-select-contract-address" v-model="selected_address"
            :options="contract_addresses" class="mb-2 mr-sm-2 mb-sm-0" v-if="selected_contract"></b-form-select>

          <label v-if="selected_contract" class="mr-sm-2" for="inline-form-custom-select-contract-abi">abi </label>
          <b-form-select id="inline-form-custom-select-contract-abi" v-model="selected_abi" :options="abis"
            class="mb-2 mr-sm-2 mb-sm-0" v-if="selected_contract" @change="OnChangeAbi"></b-form-select>
        </b-form>

        <div class="mt-2" v-for="(value, name) in selected_abi" v-bind:key="name">
          <b-form-group label-cols-sm="3" :label="`${name}`" label-align-sm="right" :label-for="`${name}`">
            <b-form-input v-if="selected_abi" :plaintext="readonly(`${name}`)" class="mr-sm-2" :id="`${name}`"
              :ref="`${name}`" :type="`${value}`" :placeholder="`${value}`" :disabled="readonly(`${name}`)">
            </b-form-input>
          </b-form-group>
        </div>
        <b-button v-if="status_compile"  :disabled="!selected_abi" block variant="outline-primary" @click="OnDeploy" class="mt-2">  {{selected_abi?selected_abi.name==selected_contract.split(".sol")[0]?"Deploy":"SendTx":"Deploy Or SendTransaction"}}</b-button>
        <!-- <b-table striped hover :items="deployed"></b-table> -->
        <b-button  class="mt-2" block variant="outline-primary"  @click="OnLearn">
                    <span>Learn</span> 
        </b-button>
        <b-card class="mt-3" header="Result">
          <span v-html="log"></span>
        </b-card>
      </b-form>
    </b-card>
  </div>
</template>


<script>
  const event_Upload = "Upload";
  const event_Compile = "Compile";
  const event_Deploy = "Deploy";
  const event_Transaction = "Transaction";
  const event_Call = "Call";
  const client_Upload = "Upload_client";
  const client