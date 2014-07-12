

    var integrationBus = JSON.stringify({
      type: "IntegrationBus",
      integrationNodes: {
        uri: "/integrationbus/integrationnodes",
        integrationNode: [
          {
            name: "TESTNODE_Administrator",
            host: "somehost.ibm.com",
            mqtt: 1883,
            type: "broker",
            executionGroups: {
              uri: "/apiv1/executiongroups",
              type: "executionGroups",
              executionGroup: [
                {
                  type: "executionGroup",
                  uri: "/apiv1/executiongroups/default",                      
                  name: "default",
                  applications: {
                     uri: "/apiv1/executiongroups/default/applications",
                     type: "applications",
                     application: [{
                         type: "application",
                         uri: "/apiv1/executiongroups/default/applications/Hosie_HTTP%20one-way",                       
                         name: "Hosie_HTTP one-way",
                         isRunning: true,
                         runMode: "running",
                         startMode: "Maintained",
                         libraries: {
                             uri: "/apiv1/executiongroups/default/applications/Hosie_HTTP%20one-way/libraries",
                             type: "libraries",
                             library: [],
                             internal: "false"
                         },
                         messageFlows: {
                             uri: "/apiv1/executiongroups/default/applications/Hosie_HTTP%20one-way/messageflows",
                             type: "messageFlows",
                             messageFlow: [{
                                 type: "messageFlow",
                                 uri: "/apiv1/executiongroups/default/applications/Hosie_HTTP%20one-way/messageflows/RecordDistributor",
                                 propertiesUri: "/apiv1/executiongroups/default/applications/Hosie_HTTP%20one-way/messageflows/RecordDistributor/properties",
                                 UUID: "8a6b42c6-305f-4129-b42b-d9ff127bb272",
                                 name: "RecordDistributor",
                                 isRunning: true,
                                 runMode: "running",
                                 startMode: "Maintained",
                                 flowDesignUri: "/apiv1/executiongroups/default/applications/Hosie_HTTP%20one-way/messageflows/RecordDistributor/flowdesign",                                                              
                                 flowStatsTopic: "$SYS/Broker/TESTNODE_Administrator/Statistics/JSON/SnapShot/default/applications/Hosie_HTTP one-way/messageFlows/RecordDistributor"
                             }]
                         }
                     }]
                  }
              }]
            }
          }]
      }
    });


function APIv1Stub(){
    console.log("stubbing");
    sinon.log=function(str){
        console.log(str);
    }
    var stub = sinon.fakeServer.create();
    stub.respondWith("GET", "/apiv1/integrationbus?depth=7",integrationBus);    
    stub.autoRespond=true;
    return stub;
}

