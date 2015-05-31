/*
Copyright 2014-2015 
Author John Hosie 
 
  All rights reserved. This program and the accompanying materials
  are made available under the terms of the Eclipse Public License v1.0
  which accompanies this distribution, and is available at
  http://www.eclipse.org/legal/epl-v10.html
 
  Contributors:
      John Hosie - initial implementation 
*/

Integration = (function(){
  var MAX_SNAPSHOT_RECORDS=100;
  /**
   * internal functions to manage the MQTT connnections and 
   * subscription 
   * 
   * @name PubSub 
   * @constructor 
   */
  var PubSub = function(integrationNodeName,host,port){
      this.integrationNodeName  = integrationNodeName;
      this.mqttClient = new Paho.MQTT.Client(host, port, "i-d:"+integrationNodeName.substring(0,18));

      /** map of topic names to jquery Callbacks objects */
      this.subscriberCallbacks={};
      this.pendingSubscriptions=[];      
      this.connected=false;
      
      /**
       * Register for callback on a specific topic.  Wildcards are not 
       * supported. 
       * @function 
       * @name on 
       * @private 
       * 
       * @param topic {String} name of topic. In general, wildcards 
       *              are not supported. The only exception is the
       *              following 2 special wildcards
       *                 IBM/IntegrationBus/#/Statistics/JSON/SnapShot/#
       *                 (flowstats)
       *  
       *                 IBM/IntegrationBus/#/Statistics/JSON/Resource/#
       *                 (resourceStats)
       *  
       * @param callback {Function} callback to be invoked when a 
       *                 message is published on the specified topic.
       *                 callback takes a single argument which is an
       *                 object. The type of the object depends on the
       *                 topic.
       *          
       *  
       */
      function on(topic,callback){
          //TODO is it more efficient just to create a new client connection for each wildcard subscription?
          
          if(this.subscriberCallbacks[topic]===undefined) {
              this.subscriberCallbacks[topic]=$.Callbacks();
          }
          this.subscriberCallbacks[topic].add(callback);
          if(this.connected){
            
          }else{
            this.pendingSubscriptions.push({
              topic    : topic,
              callback : callback
            });
          }
          
      }
      this.on=on;

      function onMessageArrived(message){
        try{
          var topicString = message.destinationName;
          var callbacks = this.subscriberCallbacks[topicString];
          var payloadObj= JSON.parse(message.payloadString);            
          if(callbacks) {               
               callbacks.fire(payloadObj);
          }          
        }catch(err){
          console.log("ERROR in onMessage");
          console.dir(err);
        }
      }
      this.mqttClient.onMessageArrived = $.proxy(onMessageArrived,this);

      function connect(callback){        
          this.mqttClient.onConnectionLost = function(response){ 
              Integration.onError("lost connection to MQTT",response);
          };
          var connectOptions = {
              timeout:5,
              keepAliveInterval : 60,
              useSSL : false,
              onSuccess : $.proxy(function(){
                      this.connected=true;
                      this.processPendingSubscriptions(callback);
              },this),
              onFailure: function(responseObject) {
                      onError("failed connecting to MQTT(" + integrationNodeName + ":" + host + ":" + port,
                                             responseObject);
                      callback(responseObject);
              }
          };
          this.mqttClient.connect(connectOptions);
      }
      this.connect=connect;
      
      function processPendingSubscriptions(callback){          
        var options = {
          qos:0,
          onFailure: function(responseObject) {
            onError(responseObject);
          }
        };
        var self=this;
        this.pendingSubscriptions.forEach(function(item){
          var topic = item.topic;
          var callback = item.callback;
          self.mqttClient.subscribe(topic,options);
        
        });
                    
      };
      this.processPendingSubscriptions=processPendingSubscriptions;
  };

   /**
   * Get the singleton IntegrationBus object. 
   * @function 
   * @name getIntegrationBus
   * @param {Function} callback function to call once the 
   *                 integration bus is ready i.e. once its data
   *                 has been loaded from the server.
   */
  function getIntegrationBus(callback){
      if(IntegrationBus.instance!=undefined) {
          callback(null,IntegrationBus.instance);        
      };

      $.getJSON('/apiv1/integrationbus?depth=8',function(result){
          IntegrationBus.instance=  new IntegrationBus(result);    
          callback(null,IntegrationBus.instance);
          
      }).fail(function(error){
          onError("failed getting JSON for integration bus", error);
          callback(error);
      });
      
  }
  

  function simulateIntegrationBus(callback){
      var instance        = new IntegrationBusSimulation();    
      callback(null,instance);
  }

  function onError(message,error){
          console.log("onError");
          if(error instanceof String) {
              console.log(message + " : " + error)
          }else{
              console.log(message);
              console.dir(error);
          }
      }    

  /**
   * 
   * Internal constructor.  Use getIntegrationBus function to 
   * ensure singleton use. 
   * @constructor 
   * @private  
   */
  IntegrationBus = function(other){
      
      /**
       * type is always set to IntegrationBus. 
       * @member 
       * @name type 
       */
      this.type = "IntegrationBus";    
      this.integrationNodes = [];
      this.getFlowInstances=function(flowName){
        var flowInstances =[];
        this.integrationNodes.forEach(function(integrationNode){
          flowInstances = flowInstances.concat(integrationNode.getFlowInstances(flowName));
        });
        return flowInstances;
      };
      
      if(other===undefined){
        //nothing else to do 
        return;
        
      }

      
      //ensure singleton use
      if (this.instance!=undefined){
          throw "IntegrationBus must be a singleton";
      };
      
      other.integrationNodes.integrationNode.forEach(function(nextIntegrationNode){
          this.integrationNodes.push(new IntegrationNode(nextIntegrationNode));
      },this);
      
  };

  /**
   * 
   * Internal constructor.  Do not use.  To get an IntegrationNode
   * object, use 
   * getIntegrationBus().integrationNodes[] 
   * @constructor 
   * @private 
   */
  IntegrationNode = function(other){
       /** 
       *  
       * type is always set to IntegrationNode. 
       * @member 
       * @name type
       *  
       */
       
      this.type = "IntegrationNode";
      this.integrationServers=[];
      this.flowStatsEventHandlers=null;
      this.resourceStatsEventHandlers=null;
      this.getFlowInstances=function(flowName){
        var flowInstances =[];
        this.integrationServers.forEach(function(integrationServer){
          flowInstances = flowInstances.concat(integrationServer.getFlowInstances(flowName));
        });
        return flowInstances;
      };
      this.onFlowStats=function(snapShot){
        if(this.flowStatsEventHandlers){
          this.flowStatsEventHandlers.fire(snapShot);                  
        }        
      };
      
      /**
       *  Registers a listener for events
       * @method on 
       * @param {String} eventType the name of the event being 
       *        listened for. Possible values are 'messageFlowStats'.
       * 
       * @param {Function} listener function that is called when the 
       *        event fires.  Inside the function this refers to the
       *        IntegrationNode object that emitted the event.
       *  
       * Arguments passed to that function depend on the eventType.
       *            messageFlowStats - listener(currentSnapshot) 
       *  
       */
      function on(eventType,callback){
           if(eventType=='messageFlowStats') {
               if(this.flowStatsEventHandlers==null) {
                   this.flowStatsEventHandlers=$.Callbacks();                   
               }
               this.flowStatsEventHandlers.add(callback);
           }else if(eventType=='resourceStats') {
               if(this.resourceStatsEventHandlers==null) {
                   this.resourceStatsEventHandlers=$.Callbacks();
                   this.pubSub.on("IBM/IntegrationBus/"+ this.name +"/Statistics/JSON/Resource/+",$.proxy(function(snapShot){
                       this.resourceStatsEventHandlers.fire(snapShot);
                   },this));
               }
               this.resourceStatsEventHandlers.add(callback);
           }
      }
      this.on=on;
      
      if(other===undefined){
        //nothing else to do 
        return;        
      }
      this.name = other.name;
      this.host = other.host;
      this.mqtt = other.mqtt;
      this.pubSub = new PubSub( this.name,this.host,this.mqtt);
      this.pubSub.connect(
          function(error){
              if(error) {
                  onError("error connecting to pubSub for " + this.name,error);
              }        
      });
      

      other.integrationServers.integrationServer.forEach(function(nextIntegrationServer){
          this.integrationServers.push(new IntegrationServer(nextIntegrationServer,this));
      },this);

       

      
  };

  /**
   * Internal constructor. Do not use. To get an IntegrationServer 
   * object, use 
   * IntegrationNode.integrationServers[] 
   */
  IntegrationServer = function(other,integrationNode){
       /** 
       *  
       * type is always set to IntegrationServer. 
       * @member 
       * @name type
       *  
       */
      this.type = "IntegrationServer";
      /** provide getter for integration node rather than a
       *  property to avoid cyclic reference problems   */
      this.onFlowStats=function(stats){
        this.getIntegrationNode().onFlowStats(stats);
      };
      this.applications = [];
      this.getFlowInstances=function(flowName){
        var flowInstances =[];
        this.applications.forEach(function(application){
          var flow = application.getMessageFlow(flowName);
          if(flow ){
            flowInstances.push(flow);            
          }          
        });
        return flowInstances;
      };
      this.setIntegrationNode=function(integrationNode){
        this.getIntegrationNode=function(){
          return integrationNode;
        };
      };
      if(other===undefined){
        //nothing else to do 
        return;        
      }      
      this.name = other.name;
      this.setIntegrationNode(integrationNode);
      var self=this;
      other.applications.application.forEach(function(nextApplication){
          this.applications.push(new Application(nextApplication,self));
      },this);

  };

  /**
   * Internal constructor. Do not use. To get an Application
   * object, use IntegrationServer.applications[] 
                                   */
  Application = function(other,integrationServer){
       /** 
       *  
       * type is always set to Application. 
       * @member 
       * @name type
       *  
       */
      this.type = "Application";
      /** provide getter for integration node rather than a
       *  property to avoid cyclic reference propblems   */
      this.getIntegrationNode=function(){
          return integrationServer.getIntegrationNode();
      };
      this.onFlowStats=function(snapShot){
        this.getIntegrationServer().onFlowStats(snapShot);
      }
      this.messageFlows = [];
      this.setIntegrationServer=function(integrationServer){
        this.getIntegrationNode=function(){
          return integrationServer.getIntegrationNode();
        };
        this.getIntegrationServer= function(){
          return integrationServer
        };
        
      };
      this.getMessageFlow=function(flowName){
        var messageFlow=null;
        this.messageFlows.forEach(function(nextMessageFlow){
          if(nextMessageFlow.name==flowName){
            messageFlow=nextMessageFlow;
          }
        });
        return messageFlow;
      };      
      if(other===undefined){
        //nothing else to do 
        return;        
      }
      
      this.setIntegrationServer(integrationServer);
      this.name = other.name;      
      other.messageFlows.messageFlow.forEach(function(nextMessageFlow){
          this.messageFlows.push(new MessageFlow(nextMessageFlow,this));
      },this);
  };

  /**
   * Internal constructor. Do not use. To get a MessageFlow 
   * object, use Application.messageFlows[] 
                                   */
  MessageFlow = function(other,application){
       /** 
       *  
       * type is always set to MessageFlow. 
       * @member 
       * @name type
       *  
       */
      this.type = "MessageFlow";
      this.flowStatsEventHandlers=$.Callbacks();
      this.snapshots=[];
      this.onStats = function(stats){
        this.snapshots.push(stats);
        this.getApplication().onFlowStats(stats);
        if(this.snapshots.length>MAX_SNAPSHOT_RECORDS){
          this.snapshots.shift();          
        }
        this.flowStatsEventHandlers.fire(stats);
      };
      
      /**
       *  Registers a listener for events
       * @method on 
       * @param {String} eventType the name of the event being 
       *        listened for. Possible values are 'resourceStats'
       * 
       * @param {Function} listener function that is called when the 
       *        event fires.  Inside the function this refers to the
       *        MessageFlow object that emitted the event.
       *  
       * Arguments passed to that function depend on the eventType.
       *            messageFlowStats - listener(currentSnapshot) 
       *  
       */
      this.on = function(eventType,callback){
           if(eventType=='messageFlowStats') {
               this.flowStatsEventHandlers.add(callback);
           }
      }
      
      this.setApplication = function(application){
        /** provide getter for integration node rather than a
        *  property to avoid cyclic reference propblems   */
        this.getIntegrationNode=function(){
          return application.getIntegrationNode();
        };
        this.getApplication= function(){
          return application;
        };        
      };
      
      if(other===undefined){
        //nothing else to do 
        return;        
      }
      
      this.name = other.name;
      this.flowStatsTopic=other.flowStatsTopic;
      this.setApplication(application);
      
      //subscribe to accounting and stats for this flow
      this.getIntegrationNode().pubSub.on(this.flowStatsTopic,$.proxy(this.onStats,this));
      

      /** 
       * This event fires whenever a new snapshot of resource 
       * statistics is published. 
       * @event resourceStats 
       * @param {Object} currentSnapshot 
       */

  };
  
  MessageFlowSimulation = function(name,application){
    this.name=name;
    //re-initialise any array or object properties
    this.snapshots=[];
    var self=this;
    this.setApplication(application);
    setInterval(function(){
      var now=new Date();
      var hr = now.getHours();
      if (hr < 10) {
        hr = "0" + hr;
      }
      var min = now.getMinutes();
      if (min < 10) {
        min = "0" + min;
      }
      var sec = now.getSeconds();
      if (sec < 10) {
        sec = "0" + sec;
      }

      var currentTime = hr +":"+ min +":"+ sec +".000000";
      self.onStats( {
                      WMQIStatisticsAccounting : {
                          RecordType:"SnapShot",
                          RecordCode:"Snapshot",
                          MessageFlowName:self.name,
                          MessageFlow:{
                              EndTime:currentTime,
                              TotalCPUTime:Math.floor(1000*Math.random()),
                              TotalInputMessages:Math.floor(400*Math.random())
                          }
                      }
                    });
      
    },5000);    
  };
  MessageFlowSimulation.prototype = new MessageFlow();
  
  ApplicationSimulation = function(name,integrationServer){
    this.name=name;
    this.messageFlows=[];
    this.addMessageFlow = function(name){
      var newMessageFlow = new MessageFlowSimulation(name,this);
      this.messageFlows.push(newMessageFlow);
      return newMessageFlow;
    };
    this.setIntegrationServer(integrationServer);
    
  };
  ApplicationSimulation.prototype = new Application;
  
  IntegrationServerSimulation = function(name,integrationNode){
    this.name=name;
    this.applications=[];
    this.addApplication = function(name){
      var newApplication = new ApplicationSimulation(name,this);
      this.applications.push(newApplication);
      return newApplication;      
    };    
    this.setIntegrationNode(integrationNode);
  };
  
  IntegrationNodeSimulation=function(name){
    this.name=name;
    this.integrationServers=[];
    
    this.addIntegrationServer=function(name){
      var newServer = new IntegrationServerSimulation(name,this);
      this.integrationServers.push(newServer);
      return newServer;
    };    
  }

  IntegrationBusSimulation = function(){
    this.integrationNodes=[];
    this.addIntegrationNode=function(name){
      var newNode = new IntegrationNodeSimulation(name,this);
      this.integrationNodes.push(newNode);
      return newNode;
    };   
  }
  
  IntegrationBusSimulation.prototype    = new IntegrationBus();
  IntegrationNodeSimulation.prototype   = new IntegrationNode();
  IntegrationServerSimulation.prototype = new IntegrationServer();
  
  
  return{
      getIntegrationBus : getIntegrationBus,
      simulateIntegrationBus : simulateIntegrationBus,
      onError:onError
  }

})();




