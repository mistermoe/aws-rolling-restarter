RollingRestarter
==========

**progressively restart ec2 instances under any OpsWorks layer**


----------
## Description ##
Progressively restarts ec2 instances under any Opsworks layer, x machines at a time. 

----------


Installation
------------
```
npm install aws-rolling-restarter
```
----------
## Usage ##
```javascript
var restarter = require("aws-rolling-restarter");

restarter.init({
  accessKeyId: "Your accessKeyId",
  secretAccessKey: "Your secretAccessKey",
  region: "region where your machines are hosted",
  layerId: "the layer under which the ec2 instances are",
  groupSize: 2, // the amount of ec2 instances you want to restart at a time.
  retryOnSetupFailed: true, // whether or not to attempt stopping and starting again if machine ends up with setup_failed status. Default: false
});

restarter.start();
```
----------

