#Testing

###Tools and frameworks used for testing are
* mocha     - for server side and browser side test runner
* should    - for assertions
* supertest - for server side http assertions

###Running the tests
If you want to run these tests, you need to have those modules listed above installed. I install them globally but you can install them locally. To do so, you need to run npm from the top level directory ( one above the location of this file).
Once you have installed those prereqs, cd to the top level directory and run ```mocha```.

To just run the front end tests, you don't need to install anything.  You only need to make sure that the server has been started with the test mode flag
```
node app.js --test
```

and then point your browser at [http://localhost:3002/test/index.html] (http://localhost:3002/test/index.html)



