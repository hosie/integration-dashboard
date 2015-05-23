#integration-dashboard


Visualisation of activity across multiple integration nodes. For use with IBM Integration Bus.

This is still early days in the development of integration-dashboard but to get an idea of the intention, see http://hosie.github.io/integration-dashboard/index.html


## Try it
### Install
1. Download and install node.js - http://nodejs.org/download/
2. Download - [integration-dashboard] (https://github.com/hosie/integration-dashboard/archive/v0.1.zip)  and unzip
3. open a console, add node.js to your PATH, cd to the directory where you unzipped in (2). cd to src ( the directory that contains app.js and package.json - among other things)
4. install the prereqs ``` npm install ```
5. edit hosts.JSON.  For each broker, provide host, port ( web admin port) and mqtt ( port for MQTT websockets).
6. Start the node.js application ``` node app.js ```
7. Point your browser at [http://localhost:3002/dashboard.html] (http://localhost:3002/dashboard.html)

### Play

You should see one circle for each Integration Node.
Click the node to see execution groups.  
Drag the node to see the circle pack widget.
Drag the flow to see message per second line chart
Drag the EG to see a list of resource manager types 
TODO - add a widgets for resource manager stats widgets and activity log that will apear when you drag and drop the resource manager type

### Notes
Make sure that flow stats and resource manager stats are turned on.
You will get errors if your Integration Node does not have a queue manager.
There are a few bugs.  If you fix any, I'd love to hear about it.

## Testing
# prereqs
* make sure mocha is installed
```
npm install -g mocha
```

# run the unit tests for the front end code
* start the server in test mode
```
node app.js --test
```
* point your browser(s) at [http://localhost:3002/Test/index.html](http://localhost:3002/Test/index.html)

# run backend API and unit tests
* cd to project root
* run ``mocha``

# manual test of visuals
* start the server without the --test flag
* point browser at [http://localhost:3002/Test/index.html](http://localhost:3002/Test/index.html)

