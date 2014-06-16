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
var app = express();
var proxy = require('./routes/proxy.js');
var apiv1 = require('./routes/apiv1.js');
var fs = require('fs');

fs.readFile('hosts.json', function (err, data) {
  if (err) throw err;
  
  var hosts = JSON.parse(data);
  hosts.forEach(function(item){
    //create a router for each one
    if(!(item.port))
    {
            item.port=4414;
    }
    var proxyRouter = proxy({host:item.host,port:item.port,mqtt:item.mqtt});
    app.use("/apiv1/integrationnodes/"+item.host,proxyRouter.router);
  });


  app.use("/apiv1",apiv1(hosts));

  //all static html content is in public
  app.use("/",express.static(__dirname + "/public"));

  app.listen(3002);
  console.log('Listening on port 3002');
});

