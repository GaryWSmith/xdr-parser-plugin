/**
 * Copyright 2019 Gary Smith (garysmithrsa@gmail.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


module.exports = function (app) {

  var plugin = {};
  plugin.id = 'xdrParser-plugin';
  plugin.name = 'NMEA0183 XDR Sentence Parser';
  plugin.description = 'This plugin parses XDR sentences which are defined in the Plugin Config';

  var xdrProcCallback = undefined;
  var sentenceEventName = undefined;

  plugin.start = function (options, restartPlugin) {		// the options arg is the persistent data set by the schema
    let dictionary = {"definitions" : options.dictionary};
    sentenceEventName = options.sentenceEventName	        // must match the "sentenceEvent" value in the json.settings file
    var processSentence = require('./xdrParser.js');

    var mexp = require('math-expression-evaluator');		// check the expressions
      for (let l=0; l < dictionary.definitions.length; l++){
          var expression = dictionary.definitions[l].expression.replace(/x/g, 1); 
          try{
              var value = mexp.eval(expression);
//	      console.log(value);
	     }
          catch(e){
              app.setProviderError("Problem with expression: " + dictionary.definitions[l].expression + "  - " + e.message);
  	      plugin.stop();
              return;
              }          
      }

    xdrProcCallback = (string) => {	
	var skDeltaObj = processSentence(string, dictionary);
	if (skDeltaObj != null){
          app.handleMessage('xdrParser-plugin', skDeltaObj);
        }};
 
    app.signalk.on(sentenceEventName, xdrProcCallback);
    app.debug('Plugin started');
    app.setProviderStatus("Processing XDR Strings."); 
  };

  plugin.stop = function () {
    // Here we put logic we need when the plugin stops
    if (xdrProcCallback) {
      app.signalk.removeListener(sentenceEventName, xdrProcCallback);
      xdrProcCallback = undefined;
    }
     app.debug('Plugin stopped');
     app.setProviderStatus("Plugin stopped."); 
  };

   plugin.schema = {
    type: "object",
    properties: { 
      sentenceEventName : {
        type: 'string',  
        title: 'Name of the nmea0183 sentenceEvent (must match an incoming NMEA type connection which contains XDR sentences)',
        default: 'nmea0183'},
      dictionary: {
        type: "array",
        title: "XDR Sensor definitions",
        items: {
          type: "object",
          required: [ 'name', 'expression', 'sk_path' ],
          properties: {
            type: {
              type: 'string',
              title: 'Descriptive Sensor name',
              description: 'A short descriptive name for the sensor',
              default: 'Air temperature'
            },
            data: {
              type: 'string',
              title: 'Category',
              description: 'The type of data',
              default: 'temperature'
            },
            units: {
              type: 'string',
              title: 'Units',
              description: 'The units in which the data is received (1st field of the quadruple)',
              default: 'C'
            },
            name: {
              type: 'string',
              title: 'XDR Sensor identifier',
              description: 'The EXACT sensor name (4th field of the XDR quadruple) ',
              default: 'ENV_OUTAIR_T'
            },
            expression: {
              type: 'string',
              title: 'Math expression',
              description: 'A mathematical expression to convert this sensor data (2nd field) into SI units',
	      default: '(x+273.15)'
            },
            sk_path: {
              type: 'string',
              title: 'Signalk Path ',
              description: 'The path to which this sensor is to be mapped',
	      default: 'environment.outside.temperature'
            }
          }
        }
      }
    }
  }

  return plugin;
};
