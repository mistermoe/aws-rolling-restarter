var AWS = require("aws-sdk");
var events = require('events');
var emitter = new events.EventEmitter();

var global = {
  old_machines: {
    stopped: [],
    online: [],
    shutting_down: [],
    total: 0
  },

  new_machines: {
    starting_up: [],
    online: [],
  },

  machine_num: 0,
  first_restart: true
}

function getMachines(callback) {
  global.opsworks.describeInstances({LayerId: global.layerId}, function(err, data){
    if (err) throw err;
    var machine;
    for (var i = 0; i < data["Instances"].length; i += 1) {
      machine = {};
      if (data["Instances"][i].Status == "stopped") {

        machine.instance_id = data["Instances"][i].InstanceId;
        machine.name = data["Instances"][i].Hostname;

        global.old_machines.stopped.push(machine);
      }
      else if (data["Instances"][i].Status == "online") {
        machine.instance_id = data["Instances"][i].InstanceId;
        machine.name = data["Instances"][i].Hostname;
        global.old_machines.online.push(machine);
      }
    }
    global.old_machines.total = global.old_machines.online.length;
    callback();
  });
}

function stopMachine(machine, machineNum) {
  global.old_machines.shutting_down.push(machine);
  console.log("( " + machine.name + " ) shutting down");

  global.opsworks.stopInstance({InstanceId: machine.instance_id}, function(err, data){
    if (err) throw err;

    var checkIfStopped = setInterval(function(){
      global.opsworks.describeInstances({InstanceIds: [machine.instance_id]}, function(err, data){

        if (data["Instances"][0].Status == "stopped") {
          clearInterval(checkIfStopped);

          console.log("( " + machine.name +" ) stopped.");
          var starting_up = global.old_machines.shutting_down.splice(global.old_machines.shutting_down.indexOf(machine), 1)[0];
          global.new_machines.starting_up.push(starting_up)
          startMachine(starting_up, machineNum);
        }
      });
    }, machineNum * 1000);
  });
}

function startMachine(machine, machineNum) {
  global.opsworks.startInstance({InstanceId: machine.instance_id}, function(err, data){
    if (err) throw err;
    console.log("( " + machine.name + " ) starting up.");
    var checkIfOnline = setInterval(function(){
      global.opsworks.describeInstances({InstanceIds: [machine.instance_id]}, function(err, data){

        if (data["Instances"][0].Status == "online") {
          console.log(data["Instances"][0].Status);
          clearInterval(checkIfOnline);

          var online = global.new_machines.starting_up.splice(global.new_machines.starting_up.indexOf(machine), 1)[0];
          global.new_machines.online.push(machine);

          console.log("[" + global.new_machines.online.length + "] ( " + machine.name + " ) online");
          console.log("grabbing next machine to restart");

          if (global.first_restart) {
            console.log("(" + machine.name + ")" + " first place! I am the watcher.");
            global.first_restart = false;
            stop();
          }

          restartNextMachine();
        }
        else if (data["Instances"][0].Status == "stopped") {
          clearInterval(checkIfOnline);
          console.log(data["Instances"][0].Status);
          console.log("did the weird thing. attempting to start " + machine.name + " again.");
          startMachine(machine);
        }
        else if (data["Instances"[0].status] == "setup failed") {
          clearInterval(checkIfOnline);
          console.log("( " + machine.name + " ) setup failed. stopping then starting again." );
          stopMachine(machine);
        }
      });
    }, machineNum * 1000);

  });
}

function restartNextMachine() {
  if (global.old_machines.online.length > 0) {
    var machine = global.old_machines.online.pop();
    global.machine_num += 1;
    stopMachine(machine, global.machine_num);
  }
}

function stop() {
  if (global.old_machines.online.length > 0 ) { }
  else if (global.old_machines.online.length == 0 && global.new_machines.online.length != global.old_machines.total) {
    console.log("no old machines to restart. Waiting for machines to finish starting up. Checking again in 5 seconds..");
  }
  else if (global.new_machines.online.length == global.old_machines.total) {
    console.log("all machines restarted");
    process.exit(0);
  }

  var checkIfDone = setTimeout(function(){
    stop();
  }, 150000);
}

function start() {
  getMachines(function(){
    console.log("grabbing " + global.groupSize + " machines to restart");

    var shutting_down;
    for (var i = 0; i < global.groupSize; i += 1) {
        shutting_down = global.old_machines.online.pop();
        global.machine_num += 1;
        (function(machine, machineNum){
          stopMachine(machine, machineNum);
        })(shutting_down, global.machine_num);
    }
  });
}

module.exports = {
  init: function(config) {
    global.opsworks = new AWS.OpsWorks({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region
    });

    global.layerId = config.layerId;
    global.groupSize = config.groupSize;
  },

  start: start
}