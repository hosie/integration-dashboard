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
var express = require('express');
var router = express.Router();
var http = require('http');

var integrationnodes=[];

function initNodes(){
    integrationnodes.forEach(function(item,i){
        var options = {
            hostname: item.host,
            port: item.port,
            path: '/apiv1',
            method: 'GET',
 
        };
        var resultObject;
        var resultString="";
        console.log("requesting from %j",JSON.stringify(options));
        var req = http.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {            
                console.log("on data" + chunk);
                resultString=resultString+chunk;
            });
            res.on('end', function () {            
                console.log("on end");
                var resultObject = JSON.parse(resultString);
                console.dir(resultObject);
                item.name=resultObject.name;
                //TODO drill into properites and get desc etc...
            });
        });

        req.setHeader('Accept','application/json');

        req.on('error', function(e) {
            console.log('initNodes:problem with request to %j:%j.  Error=%j',item.host,item.port,e.message);
        });

        req.end();
    });
}

module.exports = function(hostlist){
    hostlist.forEach(function(item,i){
        integrationnodes.push({
            host:item.host,
            port:item.port,
            mqtt:item.mqtt
        });
    });
    initNodes();

    router.get('/integrationnodes',function(req,res){
        res.send(integrationnodes);
    });

    router.get('/integrationbus',getIntegrationBus);    
    
    return router;
}


function getIntegrationBus(request,reply){

    var depth=request.param('depth');
    console.log("getIntegrationBus(%j)",depth);
    var remainingRequest=integrationnodes.length;
    
    var queryParms="";
    var replyObject={
        type:"IntegrationBus",
        integrationNodes:{
            uri:"/integrationbus/integrationnodes",    
            integrationNode:[]
        }
    };    
 
    if(depth>1) {
        depth=depth-1;
        queryParms="?depth="+depth;
    }

    integrationnodes.forEach(function(nextHost){
    
      var options = {
          hostname: nextHost.host,
          port: nextHost.port,
          path: '/apiv1/executiongroups' + queryParms,
          method: 'GET'
      };

      var nextNode = {name:nextHost.name};
      replyObject.integrationNodes.integrationNode.push(nextNode);

      var resultObject;
      var resultString="";
      console.log("requesting from %j",JSON.stringify(options));
      var req = http.request(options, function(res) {
          console.log('STATUS: ' + res.statusCode);
          console.log('HEADERS: ' + JSON.stringify(res.headers));
          res.setEncoding('utf8');

          res.on('data', function (chunk) {
              console.log("on data:"+chunk);
              resultString=resultString+chunk;              
          });
          res.on('end',function(){
              console.log("on end");
              var resultObject = JSON.parse(resultString);
              console.dir(resultObject);
              nextNode.type = "broker";
              nextNode.executionGroups=resultObject;       
              remainingRequest--;       
              console.log(remainingRequest + " remaining");
              if(remainingRequest == 0) {
                  reply.send(replyObject);
              }
          });          
      });

      req.setHeader("Accept","application/json");

      req.on('error', function(e) {
          console.log("getIntegrationBus: problem with request for %j",JSON.stringify(options));
          console.log("error: %j",e.message);
          console.log("already received %j",resultString);
          //TODO copy error to reply object?
          remainingRequest--;
          if(remainingRequest == 0) {
              reply.send(replyObject);
          }
      });

      // write data to request body
      console.log("sending request");
      console.dir(req);
      req.end();
    });//end integrationnodes.forEach

}
