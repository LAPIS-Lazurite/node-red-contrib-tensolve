/**
 * Copyright 2017 Lapis Semiconducor Ltd,.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
	"use strict";
	var sqlite3 = require('sqlite3');

	function TensolveDatabase(config) {
		RED.nodes.createNode(this,config);
		var node = this;
		node.config = config;
		node.msgOut = {};

		node.status({fill:"red",shape:"ring",text:"disconnected"});
		
		if ((node.config.database === undefined) || (node.config.database === null)){
			return;
		}

		node.db = new sqlite3.Database(node.config.database);
		node.db.on('open', function() {
			node.status({fill:"green",shape:"dot",text:"connected"});
			console.log('connecting database:: '+node.config.database);
			if (parseInt(node.config.interval) !== 'NaN') {
				setInterval(function(){
					getDatabase();
				}, parseInt(node.config.interval)*1000);
			} 
		});
		node.db.on('error', function(err) {
			node.error("faile to open database",err);
		});

		node.on('input',function(msg) {
			getDatabase();
		});

		node.on('close',function(done) {
			node.db.close();
			done();
		});

		function getDatabase(){
			node.msgOut.payload = {};
			if(node.db.open) {
				node.count = 0;
				node.db.all("select id, beaconid from user",{},function(err, rows) {
					if(err===null) {
						var tmp = {};
						for(var i in rows) {
							tmp[rows[i].beaconid] = rows[i].id;
						}
						done('user',tmp);
					} else {
						console.log(err)
					}
				});
				node.db.all("select id,x,y,z from box",{},function(err, rows) {
					if(err===null) {
						var tmp = {};
						for(var i in rows) {
							tmp[rows[i].id] = {
								x: rows[i].x,
								y: rows[i].y,
								z: rows[i].z
							}
						}
						done('box',tmp);
					} else {
						console.log(err)
					}
				});
			}
		}
		function done(table,data){
			var tmp;
			node.count++;
			node.msgOut.payload[table] = data;
			console.log(node.msgOut.payload);
			if(node.count == 2) {
				node.send(node.msgOut);
			}
		}
	}

	RED.nodes.registerType("tensolve-database", TensolveDatabase);
}
