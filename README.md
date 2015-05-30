#integration-dashboard


Visualisation of activity across multiple integration nodes. For use with IBM Integration Bus.

This is still early days in the development of this project. Most of the effort until this point has been to develop a framework that provides a javascript interface to operational data from IBM Integration Bus and to facilitate with the development and re-use of widgets that visualise those data.  In future, it would be good to put energy into developing more widgets and maybe even a usable dashboard application that embeds these widgets.

The widgets are exposed as angular directives. Including one of these widgets in your application can be as straight forward as...

...doing this in your ``<html><head>``
 ```
 <script src="//ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.min.js"></script>
 <script src="/directives/iib-widgets.js"></script>
 <script src="//code.jquery.com/jquery-1.10.2.js"></script>
 <script src="/js/integrationBus.js"></script>
 <link rel="stylesheet" type="text/css" href="/css/style.css">
 ```

...doing this in your Javascript
```
... angular.module("MyApp",['iibWidgets']);..
```

... and doing this in your ``<html><body>``
```
<div iib-flow-stats iib-flow-name='MyFlow'></div>
```

If you feel like applying your own styling, then you may mess around with the stylesheet but this is optional.

The project also includes a demo dashboard application that makes use of these directives in a more flexible way. 


## Try it
### Install
1. Download and install node.js - http://nodejs.org/download/
2. Download - [integration-dashboard] (https://github.com/hosie/integration-dashboard/archive/v0.1.zip)  and unzip
3. open a console, add node.js to your PATH,
4. cd to the directory where you unzipped in (2). cd to src ( the directory that contains app.js and package.json - among other things) ``` cd integration-dashboard/src ```
4. install the server side prereqs ``` npm install ```
5. install the front end prereqs ``` bower install ```

### Preview the visual appearance of the widgets
1. While in the `` integration-dashboard/src `` directory, start the node.js application ``` node app.js ```
2. Open a browser and go to [http://localhost:3002/Test/index.html] (http://localhost:3002/Test/index.html)
3. Click on the links in the navbar to view the different widgets

### Attach to real Integration Nodes
1. edit hosts.JSON.  For each Integration Node, provide host, port ( web admin port) and mqtt ( port for MQTT websockets).
2. Start the node.js application ``` node app.js ```
3. Point your browser at [http://localhost:3002/index.html] (http://localhost:3002/index.html)

### Play with the demo dashboard app
Point your browser at [http://localhost:3002](http://localhost:3002) to use the dashboard app with the Integration Nodes that you confiugred in the hosts.JSON file in the previous step
####or...
Point your browser at [http://localhost:3002/?simulation=true](http://localhost:3002/?simulation=true) to use the dashboard app with simulated data.

### Notes
Make sure that flow stats and resource manager stats are turned on.
There are a few bugs.  If you fix any, I'd love to hear about it.

## Testing
### prereqs
* make sure mocha is installed
```
npm install -g mocha
```

### run the unit tests for the front end code
* start the server in test mode
```
node app.js --test
```
* point your browser(s) at [http://localhost:3002/Test/index.html](http://localhost:3002/Test/index.html)

### run backend API and unit tests
* cd to project root
* run ``mocha``

### manual test of visuals
* start the server without the --test flag
* point browser at [http://localhost:3002/Test/index.html](http://localhost:3002/Test/index.html)

