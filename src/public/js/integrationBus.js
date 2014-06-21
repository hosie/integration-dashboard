/*
Copyright 2014 
Author John Hosie 
 
  All rights reserved. This program and the accompanying materials
  are made available under the terms of the Eclipse Public License v1.0
  which accompanies this distribution, and is available at
  http://www.eclipse.org/legal/epl-v10.html
 
  Contributors:
      John Hosie - initial implementation 
*/

//TODO get hostname and port of MQTT socket from the REST API
var hostname="TODO-gethostnamefromREST";
var port = 1883;
var clientIdIndex=0;
function nextClientId(){
    clientIdIndex=clientIdIndex+1;
    return "hosie2" + clientIdIndex;
}
//Define prototypes
var IntegrationNode = {
    connected:false,
    flowsByTopic:{},
    listeners:[],    
    connect:function(/*callback*/){
              if(this.connected) {
                  //callback();
              }else{
                  this.mqttClient = new Messaging.Client(this.host, this.mqtt, nextClientId());
                  var thisObject = this; //to reference this in callbacks

                  this.mqttClient.onMessageArrived = function(message){                      
                      thisObject.handleStats(message);
                  }

                  this.mqttClient.onConnectionLost =function(response){
                      //TODO error handling, should really call errCallback?
                      console.dir(response);
                      alert("connection lost");
                  };

                  var connectOptions = new Object();
                  connectOptions.timeout=5;        
                  connectOptions.keepAliveInterval = 60;  
                  connectOptions.useSSL = false;
                  
                  
                  connectOptions.onSuccess = function(){
                      thisObject.connected=true;
                      var options = {qos:0, onFailure: function(responseObject) {alert(responseObject.errorMessage);}};
                      var flowStatsTopic = "$SYS/Broker/" + thisObject.name + "/Statistics/JSON/SnapShot/#/applications/#/messageflows/#";
                      //var flowStatsTopic = "#";//$SYS/Broker/#/JSON/messageflows/#";
                      //var flowStatsTopic = "$SYS/Broker/MQNODE/Statistics/JSON/SnapShot/payments/applications/StandingOrder/messageflows/#";
                      thisObject.mqttClient.subscribe(flowStatsTopic,options);
                      //callback();                     
                  };

                  connectOptions.onFailure = function (responseObject) { alert(responseObject.errorMessage);};        
                  this.mqttClient.connect(connectOptions);

              }

    },
    /*subscribe: function(messageFlow){
         
         if(this.connected==false) {
             connect(function(){
                 subscribe(messageFlow)
             });
         }else{
             var options = {qos:0, onFailure: function(responseObject) {alert(responseObject.errorMessage);}};
             listener.client.subscribe(messageFlow.flowStatsTopic,options);
         }
    },*/
    handleStats: function(message){
         try{
             var payloadObj = JSON.parse(message.payloadString);
             
             var flow = this.flowsByTopic[message.destinationName];
             flow.update(payloadObj);
             this.listeners.forEach(function(item){
                 item();
             });
             //TODO if resource stats...
         }catch(err){
             alert("Error in handle stats: " + err.message + err.stack);
         }
    },
    registerFlow : function(messageFlow){
         this.flowsByTopic[messageFlow.flowStatsTopic]=messageFlow;
    },
    addListener : function(listener){
        this.connect();
        this.listeners.push(listener);
    }
}

var MessageFlow = {
    update : function(flowStats){
        this.currentSnapShot = flowStats.WMQIStatisticsAccounting.MessageFlow;
        
    },
    updateCallbacks : [],
    onUpdate : function(callback){
        //TODO how to remove a callback?
        this.updateCallbacks.push(callback);
        //if this is the first callback, subscribe
        if(updateCallbacks.length==1){
            this.application.integrationServer.integrationNode.subscribe(this);            
        }                        
    }
}


var globalBusData;
function getIntegrationBus(callback){
    d3.json("/apiv1/integrationbus?depth=7",function(error,root){
        globalBusData=root;        
        applyIntegrationBusPrototype(globalBusData);        
        callback(error,root);        
    });
}

function applyIntegrationBusPrototype(bus){
        
    
    bus.integrationNodes.integrationNode.forEach(applyIntegrationNodePrototype);
}

function applyIntegrationNodePrototype(node){
    //TODO this wont work on IE        
    node.__proto__=IntegrationNode;

    //TODO do this in a copy constructor for IntegarationNode object
    node.flowsByTopic={};
    if(node.executionGroups != undefined) {
        node.executionGroups.executionGroup.forEach(function(integrationServer){
            integrationServer.integrationNode=node;
            applyIntegrationServerPrototype(integrationServer);
        });
    }
}

function applyIntegrationServerPrototype(integrationServer){
    integrationServer.applications.application.forEach(function (application){
        application.integrationServer=integrationServer;
        applyApplicationPrototype(application);
    });
}

function applyApplicationPrototype(application){
    application.messageFlows.messageFlow.forEach(function (messageFlow){
        messageFlow.application=application;
        application.integrationServer.integrationNode.registerFlow(messageFlow);
        applyMessageFlowPrototype(messageFlow);
        
    });
}


function applyMessageFlowPrototype(messageFlow){
    messageFlow.__proto__=MessageFlow;
}



//var topic = "$SYS/Broker/IB9NODE/Statistics/JSON/#/default/applications/MyApp/messageflows/MyFlow";
//todo make this a method of a Metric object which encapsulates the topic name and broker, eg, app, flow etc....
//TODO resourceStats or flow stats? For now, if data is an EG, then it is resource stats. Might need to be more explicit
function listenToStats(data,errCallback,successCallback){
    if(test==true) {
        return listenToStatsTest(errCallback,successCallback);
    }
    //TODO multiplex?
    try
    {
        var topic;
        if(data.type=="broker") {
            topic = "$SYS/Broker/" + data.name + "/Statistics/JSON/#/applications/#";

        }else if(data.type=="messageFlow"){
            //TODO better scheme for calculating topic name
            topic = "$SYS/Broker/" + data.parent.parent.parent.name + "/Statistics/JSON/#/" + data.name;
        }else if(data.type=="executionGroup"){
            topic = "$SYS/Broker/#/Statistics/JSON/Resource/#";// + data.name;
        }else if(data.type=="resourceType"){
            //TODO - be more efficient with connections and subscriptions?
            //could just piggy back on a previous subscription on resource stats?
            topic = "$SYS/Broker/#/Statistics/JSON/Resource/#";

        }else{
            alert("listenToStats: unknown type for stats " + data.type);
        }
        var listener={};
        listener.client = new Messaging.Client(hostname, port, nextClientId());
        listener.client.onMessageArrived = function(message){
            var payloadObj = JSON.parse(message.payloadString); 
            try{
                var result = successCallback(payloadObj);
                if(result===false) {
                    listener.client.disconnect();
                }
            }catch(error){
                console.dir(error);
                alert("exception in onMessage: " + error.toString());
            }
        }
            
        listener.client.onConnectionLost =function(response){
            //TODO error handling, should really call errCallback?
            console.dir(response);
            alert("connection lost");
        };
        var connectOptions = new Object();
        connectOptions.timeout=5;        
        connectOptions.keepAliveInterval = 60;  
        connectOptions.useSSL = false;
        connectOptions.onSuccess = function(){
            var options = {qos:0, onFailure: function(responseObject) {alert(responseObject.errorMessage);}};
            listener.client.subscribe(topic,options);
        };

        connectOptions.onFailure = function (responseObject) { alert(responseObject.errorMessage);};        
        listener.client.connect(connectOptions);
        return listener;
    } catch (error) {
        alert(error.message);
    }
    
}

function connect(callback,onMessage,widget) {
    try {
        widget.client = new Messaging.Client(hostname, port, widget.name);
    
        widget.client.onMessageArrived = onMessage;
        widget.client.onConnectionLost = onConnectionLost;
    
        // Set values from the connect form.
        var connectOptions = new Object();
        connectOptions.timeout=5;        
        connectOptions.keepAliveInterval = 60;  
        connectOptions.useSSL = false;
        connectOptions.onSuccess = callback;
        connectOptions.onFailure = function (responseObject) { alert(responseObject.errorMessage);};
      
        widget.client.connect(connectOptions);
            
    } catch (error) {
        alert(error.message);
    }
} 

function subscribe(topic,widget) {
	try {
		
		  var options = {qos:0, onFailure: function(responseObject) {alert(responseObject.errorMessage);}};
      widget.client.subscribe(topic, options);
      
    } catch (error) {
      alert(error.message);
    } 
    
}

function onConnectionLost(responseObject) {
    console.dir(responseObject);
    alert("connectionLost " + responseObject);    
}

///////////////////////////////////////////////////TEST STUBS and stuff
var test=false;
function listenToStatsTest(errCallback,successCallback){
    var statsSnapShot = {
        WMQIStatisticsAccounting :{
            
            MessageFlow  : {
                BrokerLabel  : "node1",
                ExecutionGroupName : "EG1",
                ApplicationName : "App1",
                MessageFlowName : "Flow1",
                TotalCPUTime : 50000
            }
        }
    };
    successCallback(statsSnapShot);
}


var sampleJSON = 
{
    "type": "IntegrationBus",
    "integrationNodes": {
        "uri": "/integrationbus/integrationnodes",
        "integrationNode": [{
            "name": "IB9NODE",
            "type": "broker",
            "executionGroups": {
                "uri": "/apiv1/executiongroups",
                "type": "executionGroups",
                "executionGroup": [{
                    "type": "executionGroup",
                    "uri": "/apiv1/executiongroups/eg1",
                    "propertiesUri": "/apiv1/executiongroups/eg1/properties",
                    "UUID": "e7a25d32-4601-0000-0080-c893ee784524",
                    "name": "eg1",
                    "isRunning": true,
                    "runMode": "running",
                    "isRestricted": false,
                    "services": {
                        "uri": "/apiv1/executiongroups/eg1/services",
                        "type": "services",
                        "service": []
                    },
                    "applications": {
                        "uri": "/apiv1/executiongroups/eg1/applications",
                        "type": "applications",
                        "application": [{
                            "type": "application",
                            "uri": "/apiv1/executiongroups/eg1/applications/App1",
                            "propertiesUri": "/apiv1/executiongroups/eg1/applications/App1/properties",
                            "UUID": "7f1d6232-4601-0000-0080-822cf80a490c",
                            "name": "App1",
                            "isRunning": true,
                            "runMode": "running",
                            "startMode": "Maintained",
                            "libraries": {
                                "uri": "/apiv1/executiongroups/eg1/applications/App1/libraries",
                                "type": "libraries",
                                "library": []
                            },
                            "messageFlows": {
                                "uri": "/apiv1/executiongroups/eg1/applications/App1/messageflows",
                                "type": "messageFlows",
                                "messageFlow": [{
                                    "type": "messageFlow",
                                    "uri": "/apiv1/executiongroups/eg1/applications/App1/messageflows/Flow1",
                                    "propertiesUri": "/apiv1/executiongroups/eg1/applications/App1/messageflows/Flow1/properties",
                                    "UUID": "682a6232-4601-0000-0080-822cf80a490c",
                                    "name": "Flow1",
                                    "isRunning": true,
                                    "runMode": "running",
                                    "startMode": "Maintained",
                                    "flowDesignUri": "/apiv1/executiongroups/eg1/applications/App1/messageflows/Flow1/flowdesign",
                                    "archiveStatistics": {
                                        "enabled": false,
                                        "origin": "",
                                        "nodeLevel": "none",
                                        "threadLevel": "none",
                                        "outputFormat": {
                                            "userTrace": true
                                        }
                                    },
                                    "snapshotStatistics": {
                                        "enabled": false,
                                        "origin": "",
                                        "nodeLevel": "none",
                                        "threadLevel": "none",
                                        "outputFormat": {
                                            "userTrace": true
                                        }
                                    },
                                    "policies": [{
                                        "type": "policy",
                                        "uri": "/apiv1/policy/WorkloadManagement",
                                        "policyType": "WorkloadManagement",
                                        "name": ""
                                    }]
                                }]
                            }
                        }]
                    },
                    "libraries": {
                        "uri": "/apiv1/executiongroups/eg1/libraries",
                        "type": "libraries",
                        "library": []
                    },
                    "messageFlows": {
                        "uri": "/apiv1/executiongroups/eg1/messageflows",
                        "type": "messageFlows",
                        "messageFlow": []
                    }
                }]
            }
        }, {
            "name": "TESTNODE_Administrator",
            "type": "broker",
            "executionGroups": {
                "uri": "/apiv1/executiongroups",
                "type": "executionGroups",
                "executionGroup": [{
                    "type": "executionGroup",
                    "uri": "/apiv1/executiongroups/default",
                    "propertiesUri": "/apiv1/executiongroups/default/properties",
                    "UUID": "fde9246d-53c5-4c0f-ac5d-d821f2b07411",
                    "name": "default",
                    "isRunning": true,
                    "runMode": "running",
                    "isRestricted": false,
                    "services": {
                        "uri": "/apiv1/executiongroups/default/services",
                        "type": "services",
                        "service": [],
                        "internal": "false"
                    },
                    "applications": {
                        "uri": "/apiv1/executiongroups/default/applications",
                        "type": "applications",
                        "application": [],
                        "internal": "false"
                    },
                    "libraries": {
                        "uri": "/apiv1/executiongroups/default/libraries",
                        "type": "libraries",
                        "library": [],
                        "internal": "false"
                    },
                    "sharedLibraries": {
                        "uri": "/apiv1/executiongroups/default/sharedlibraries",
                        "type": "sharedLibraries",
                        "sharedLibrary": [],
                        "internal": "false"
                    },
                    "messageFlows": {
                        "uri": "/apiv1/executiongroups/default/messageflows",
                        "type": "messageFlows",
                        "messageFlow": [],
                        "internal": "false"
                    }
                }, {
                    "type": "executionGroup",
                    "uri": "/apiv1/executiongroups/hosie",
                    "propertiesUri": "/apiv1/executiongroups/hosie/properties",
                    "UUID": "951c931c-c7fb-41b6-902b-028799547687",
                    "name": "hosie",
                    "isRunning": true,
                    "runMode": "running",
                    "isRestricted": false,
                    "services": {
                        "uri": "/apiv1/executiongroups/hosie/services",
                        "type": "services",
                        "service": [],
                        "internal": "false"
                    },
                    "applications": {
                        "uri": "/apiv1/executiongroups/hosie/applications",
                        "type": "applications",
                        "application": [],
                        "internal": "false"
                    },
                    "libraries": {
                        "uri": "/apiv1/executiongroups/hosie/libraries",
                        "type": "libraries",
                        "library": [],
                        "internal": "false"
                    },
                    "sharedLibraries": {
                        "uri": "/apiv1/executiongroups/hosie/sharedlibraries",
                        "type": "sharedLibraries",
                        "sharedLibrary": [],
                        "internal": "false"
                    },
                    "messageFlows": {
                        "uri": "/apiv1/executiongroups/hosie/messageflows",
                        "type": "messageFlows",
                        "messageFlow": [],
                        "internal": "false"
                    }
                }],
                "internal": "false"
            }
        }, {
            "name": "MQNODE",
            "type": "broker",
            "executionGroups": {
                "uri": "/apiv1/executiongroups",
                "type": "executionGroups",
                "executionGroup": [{
                    "type": "executionGroup",
                    "uri": "/apiv1/executiongroups/inquiries",
                    "propertiesUri": "/apiv1/executiongroups/inquiries/properties",
                    "UUID": "fcd23748-1f9a-460d-81ca-f254ee7c765b",
                    "name": "inquiries",
                    "isRunning": true,
                    "runMode": "running",
                    "isRestricted": false,
                    "services": {
                        "uri": "/apiv1/executiongroups/inquiries/services",
                        "type": "services",
                        "service": [],
                        "internal": "false"
                    },
                    "applications": {
                        "uri": "/apiv1/executiongroups/inquiries/applications",
                        "type": "applications",
                        "application": [{
                            "type": "application",
                            "uri": "/apiv1/executiongroups/inquiries/applications/BalanceEnquiry",
                            "propertiesUri": "/apiv1/executiongroups/inquiries/applications/BalanceEnquiry/properties",
                            "UUID": "f8a638c1-c3bb-4ad8-bd94-c8ffd7f9be6a",
                            "name": "BalanceEnquiry",
                            "isRunning": true,
                            "runMode": "running",
                            "startMode": "Maintained",
                            "libraries": {
                                "uri": "/apiv1/executiongroups/inquiries/applications/BalanceEnquiry/libraries",
                                "type": "libraries",
                                "library": [],
                                "internal": "false"
                            },
                            "messageFlows": {
                                "uri": "/apiv1/executiongroups/inquiries/applications/BalanceEnquiry/messageflows",
                                "type": "messageFlows",
                                "messageFlow": [{
                                    "type": "messageFlow",
                                    "uri": "/apiv1/executiongroups/inquiries/applications/BalanceEnquiry/messageflows/Request",
                                    "propertiesUri": "/apiv1/executiongroups/inquiries/applications/BalanceEnquiry/messageflows/Request/properties",
                                    "UUID": "d7143650-0d5f-485f-be0e-aecc8a2d0df7",
                                    "name": "Request",
                                    "isRunning": true,
                                    "runMode": "running",
                                    "startMode": "Maintained",
                                    "flowDesignUri": "/apiv1/executiongroups/inquiries/applications/BalanceEnquiry/messageflows/Request/flowdesign",
                                    "archiveStatistics": {
                                        "enabled": false,
                                        "origin": "",
                                        "nodeLevel": "none",
                                        "threadLevel": "none",
                                        "outputFormat": {
                                            "userTrace": true
                                        }
                                    },
                                    "snapshotStatistics": {
                                        "enabled": false,
                                        "origin": "",
                                        "nodeLevel": "none",
                                        "threadLevel": "none",
                                        "outputFormat": {
                                            "userTrace": true
                                        }
                                    },
                                    "policies": [{
                                        "type": "policy",
                                        "uri": "/apiv1/policy/WorkloadManagement",
                                        "policyType": "WorkloadManagement",
                                        "name": ""
                                    }]
                                }],
                                "internal": "false"
                            }
                        }, {
                            "type": "application",
                            "uri": "/apiv1/executiongroups/inquiries/applications/TransactionEnquiry",
                            "propertiesUri": "/apiv1/executiongroups/inquiries/applications/TransactionEnquiry/properties",
                            "UUID": "10c57d06-c432-4090-9cfd-1940720f79a7",
                            "name": "TransactionEnquiry",
                            "isRunning": true,
                            "runMode": "running",
                            "startMode": "Maintained",
                            "libraries": {
                                "uri": "/apiv1/executiongroups/inquiries/applications/TransactionEnquiry/libraries",
                                "type": "libraries",
                                "library": [],
                                "internal": "false"
                            },
                            "messageFlows": {
                                "uri": "/apiv1/executiongroups/inquiries/applications/TransactionEnquiry/messageflows",
                                "type": "messageFlows",
                                "messageFlow": [{
                                    "type": "messageFlow",
                                    "uri": "/apiv1/executiongroups/inquiries/applications/TransactionEnquiry/messageflows/TransactionEnquiry",
                                    "propertiesUri": "/apiv1/executiongroups/inquiries/applications/TransactionEnquiry/messageflows/TransactionEnquiry/properties",
                                    "UUID": "f68a3539-bac0-49a0-acfc-a0a7760193ea",
                                    "name": "TransactionEnquiry",
                                    "isRunning": true,
                                    "runMode": "running",
                                    "startMode": "Maintained",
                                    "flowDesignUri": "/apiv1/executiongroups/inquiries/applications/TransactionEnquiry/messageflows/TransactionEnquiry/flowdesign",
                                    "archiveStatistics": {
                                        "enabled": false,
                                        "origin": "",
                                        "nodeLevel": "none",
                                        "threadLevel": "none",
                                        "outputFormat": {
                                            "userTrace": true
                                        }
                                    },
                                    "snapshotStatistics": {
                                        "enabled": false,
                                        "origin": "",
                                        "nodeLevel": "none",
                                        "threadLevel": "none",
                                        "outputFormat": {
                                            "userTrace": true
                                        }
                                    },
                                    "policies": [{
                                        "type": "policy",
                                        "uri": "/apiv1/policy/WorkloadManagement",
                                        "policyType": "WorkloadManagement",
                                        "name": ""
                                    }]
                                }],
                                "internal": "false"
                            }
                        }],
                        "internal": "false"
                    },
                    "libraries": {
                        "uri": "/apiv1/executiongroups/inquiries/libraries",
                        "type": "libraries",
                        "library": [],
                        "internal": "false"
                    },
                    "sharedLibraries": {
                        "uri": "/apiv1/executiongroups/inquiries/sharedlibraries",
                        "type": "sharedLibraries",
                        "sharedLibrary": [],
                        "internal": "false"
                    },
                    "messageFlows": {
                        "uri": "/apiv1/executiongroups/inquiries/messageflows",
                        "type": "messageFlows",
                        "messageFlow": [],
                        "internal": "false"
                    }
                }, {
                    "type": "executionGroup",
                    "uri": "/apiv1/executiongroups/updates",
                    "propertiesUri": "/apiv1/executiongroups/updates/properties",
                    "UUID": "5603afe6-5ea4-4a73-b5f4-c3a4ecf68c67",
                    "name": "updates",
                    "isRunning": true,
                    "runMode": "running",
                    "isRestricted": false,
                    "services": {
                        "uri": "/apiv1/executiongroups/updates/services",
                        "type": "services",
                        "service": [],
                        "internal": "false"
                    },
                    "applications": {
                        "uri": "/apiv1/executiongroups/updates/applications",
                        "type": "applications",
                        "application": [{
                            "type": "application",
                            "uri": "/apiv1/executiongroups/updates/applications/ChangeAddress",
                            "propertiesUri": "/apiv1/executiongroups/updates/applications/ChangeAddress/properties",
                            "UUID": "76887649-b4a9-4b17-a0cf-04c2245c1c2e",
                            "name": "ChangeAddress",
                            "isRunning": true,
                            "runMode": "running",
                            "startMode": "Maintained",
                            "libraries": {
                                "uri": "/apiv1/executiongroups/updates/applications/ChangeAddress/libraries",
                                "type": "libraries",
                                "library": [],
                                "internal": "false"
                            },
                            "messageFlows": {
                                "uri": "/apiv1/executiongroups/updates/applications/ChangeAddress/messageflows",
                                "type": "messageFlows",
                                "messageFlow": [{
                                    "type": "messageFlow",
                                    "uri": "/apiv1/executiongroups/updates/applications/ChangeAddress/messageflows/ChangeAddress",
                                    "propertiesUri": "/apiv1/executiongroups/updates/applications/ChangeAddress/messageflows/ChangeAddress/properties",
                                    "UUID": "dff80496-470e-41cd-a1e7-ee2de75e8c30",
                                    "name": "ChangeAddress",
                                    "isRunning": true,
                                    "runMode": "running",
                                    "startMode": "Maintained",
                                    "flowDesignUri": "/apiv1/executiongroups/updates/applications/ChangeAddress/messageflows/ChangeAddress/flowdesign",
                                    "archiveStatistics": {
                                        "enabled": false,
                                        "origin": "",
                                        "nodeLevel": "none",
                                        "threadLevel": "none",
                                        "outputFormat": {
                                            "userTrace": true
                                        }
                                    },
                                    "snapshotStatistics": {
                                        "enabled": false,
                                        "origin": "",
                                        "nodeLevel": "none",
                                        "threadLevel": "none",
                                        "outputFormat": {
                                            "userTrace": true
                                        }
                                    },
                                    "policies": [{
                                        "type": "policy",
                                        "uri": "/apiv1/policy/WorkloadManagement",
                                        "policyType": "WorkloadManagement",
                                        "name": ""
                                    }]
                                }],
                                "internal": "false"
                            }
                        }],
                        "internal": "false"
                    },
                    "libraries": {
                        "uri": "/apiv1/executiongroups/updates/libraries",
                        "type": "libraries",
                        "library": [],
                        "internal": "false"
                    },
                    "sharedLibraries": {
                        "uri": "/apiv1/executiongroups/updates/sharedlibraries",
                        "type": "sharedLibraries",
                        "sharedLibrary": [],
                        "internal": "false"
                    },
                    "messageFlows": {
                        "uri": "/apiv1/executiongroups/updates/messageflows",
                        "type": "messageFlows",
                        "messageFlow": [],
                        "internal": "false"
                    }
                }, {
                    "type": "executionGroup",
                    "uri": "/apiv1/executiongroups/payments",
                    "propertiesUri": "/apiv1/executiongroups/payments/properties",
                    "UUID": "6a51e4c9-3150-4339-83e6-f5958a579a73",
                    "name": "payments",
                    "isRunning": true,
                    "runMode": "running",
                    "isRestricted": false,
                    "services": {
                        "uri": "/apiv1/executiongroups/payments/services",
                        "type": "services",
                        "service": [],
                        "internal": "false"
                    },
                    "applications": {
                        "uri": "/apiv1/executiongroups/payments/applications",
                        "type": "applications",
                        "application": [{
                            "type": "application",
                            "uri": "/apiv1/executiongroups/payments/applications/StandingOrder",
                            "propertiesUri": "/apiv1/executiongroups/payments/applications/StandingOrder/properties",
                            "UUID": "ef578c52-fe3f-4075-8481-2ce30a33af81",
                            "name": "StandingOrder",
                            "isRunning": true,
                            "runMode": "running",
                            "startMode": "Maintained",
                            "libraries": {
                                "uri": "/apiv1/executiongroups/payments/applications/StandingOrder/libraries",
                                "type": "libraries",
                                "library": [],
                                "internal": "false"
                            },
                            "messageFlows": {
                                "uri": "/apiv1/executiongroups/payments/applications/StandingOrder/messageflows",
                                "type": "messageFlows",
                                "messageFlow": [{
                                    "type": "messageFlow",
                                    "uri": "/apiv1/executiongroups/payments/applications/StandingOrder/messageflows/StandingOrder",
                                    "propertiesUri": "/apiv1/executiongroups/payments/applications/StandingOrder/messageflows/StandingOrder/properties",
                                    "UUID": "5ed8d540-b345-4c2c-9918-4f4aceb365c3",
                                    "name": "StandingOrder",
                                    "isRunning": true,
                                    "runMode": "running",
                                    "startMode": "Maintained",
                                    "flowDesignUri": "/apiv1/executiongroups/payments/applications/StandingOrder/messageflows/StandingOrder/flowdesign",
                                    "archiveStatistics": {
                                        "enabled": false,
                                        "origin": "",
                                        "nodeLevel": "none",
                                        "threadLevel": "none",
                                        "outputFormat": {
                                            "userTrace": true
                                        }
                                    },
                                    "snapshotStatistics": {
                                        "enabled": false,
                                        "origin": "",
                                        "nodeLevel": "none",
                                        "threadLevel": "none",
                                        "outputFormat": {
                                            "userTrace": true
                                        }
                                    },
                                    "policies": [{
                                        "type": "policy",
                                        "uri": "/apiv1/policy/WorkloadManagement",
                                        "policyType": "WorkloadManagement",
                                        "name": ""
                                    }]
                                }],
                                "internal": "false"
                            }
                        }],
                        "internal": "false"
                    },
                    "libraries": {
                        "uri": "/apiv1/executiongroups/payments/libraries",
                        "type": "libraries",
                        "library": [],
                        "internal": "false"
                    },
                    "sharedLibraries": {
                        "uri": "/apiv1/executiongroups/payments/sharedlibraries",
                        "type": "sharedLibraries",
                        "sharedLibrary": [],
                        "internal": "false"
                    },
                    "messageFlows": {
                        "uri": "/apiv1/executiongroups/payments/messageflows",
                        "type": "messageFlows",
                        "messageFlow": [],
                        "internal": "false"
                    }
                }],
                "internal": "false"
            }
        }]
    }
};

