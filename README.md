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
```
var restarter = require("aws-rolling-restarter");

restarter.init({
	accessKeyId: "Your accessKeyId",
	secretAccessKey: "Your secretAccessKey",
	region: "region where your machines are hosted",
	layerId: "the layer under which the ec2 instances are",
	groupSize: 2 // the amount of ec2 instances you want to restart at a time.

});

restarter.start();
```
----------

