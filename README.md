#integration-dashboard


Visualisation of activity across multiple integration nodes. For use with IBM Integration Bus.

This is still early days in the development of integration-dashboard but to get an idea of the intention, see http://hosie.github.io/integration-dashboard/index.html


## Try it
### Install
1. Download and install node.js - http://nodejs.org/download/
2. Download - [integration-dashboard] (https://github.com/hosie/integration-dashboard/archive/v0.1.zip)  and unzip
3. open a console, add node.js to your PATH,
4. cd to the directory where you unzipped in (2). cd to src ( the directory that contains app.js and package.json - among other things) ``` cd integration-dashboard/src ```
4. install the server side prereqs ``` npm install ```
5. install the front end prereqs ``` bower install ```

### Test the widgets with the simulated Integration Bus data
1. While in the `` integration-dashboard/src `` directory, start the node.js application ``` node app.js ```
2. Open a browser and go to [http://localhost:3002/Test/index.html] (http://localhost:3002/Test/index.html)
3. Click on the links in the navbar to view the different widgets

### Attach to real Integration Nodes
1. edit hosts.JSON.  For each Integration Node, provide host, port ( web admin port) and mqtt ( port for MQTT websockets).
2. Start the node.js application ``` node app.js ```
3. Point your browser at [http://localhost:3002/index.html] (http://localhost:3002/index.html)

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

