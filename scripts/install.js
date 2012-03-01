/*
 *  OpenVPNUISkeleton
 *
 *  Copyright (C)      2012 Alon Bar-Lev <alon.barlev@gmail.com>
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License version 2
 *  as published by the Free Software Foundation.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program (see the file COPYING included with this
 *  distribution); if not, write to the Free Software Foundation, Inc.,
 *  59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */

var COMImpersonateIdentify = 2;
var ADS_UF_PSASWD_CANT_CHANGE = 0x40;
var ADS_UF_DONT_EXPIRE_PASSWORD = 0x10000;

function Application(GUID, name, description, DLL, user, rolename) {
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var admin = new ActiveXObject("COMAdmin.COMAdminCatalog");
	var apps = admin.GetCollection("Applications");
	var app = apps.Add();
	app.Value("ID") = GUID;
	app.Value("Name") = name;
	app.Value("Description") = description;
	app.Value("ImpersonationLevel") = COMImpersonateIdentify;
	app.Value("ApplicationAccessChecksEnabled") = true;
	apps.SaveChanges();
	apps.Populate();
	var roles = apps.GetCollection("Roles", GUID);
	var role = roles.Add();
	role.Value("Name") = rolename;
	roles.SaveChanges();

	admin.InstallComponent(GUID, fso.GetAbsolutePathName(DLL), "", "");
	var comps = apps.GetCollection("Components", GUID);
	comps.Populate();
	for (var e = new Enumerator(comps); !e.atEnd(); e.moveNext()) {
		var comp = e.item();
		var rolesforcomp = comps.GetCollection("RolesForComponent", comp.Key);
		var roleforcomp = rolesforcomp.Add();
		roleforcomp.Value("Name") = rolename;
		rolesforcomp.SaveChanges();		
	}
}

function UserAssign(GUID, user, password) {
	var admin = new ActiveXObject("COMAdmin.COMAdminCatalog");
	var apps = admin.GetCollection("Applications");
	apps.Populate();
	var app = null;
	for (var e = new Enumerator(apps); app == null && !e.atEnd(); e.moveNext()) {
		var _app = e.item();
		if (_app.Key.toUpperCase() == GUID.toUpperCase()) {
			app = _app;
		}
	}
	if (app == null) {
		throw new Error(1, "Cannot find application " + GUID);
	}
	app.Value("Identity") = user;
	app.Value("Password") = password;
	apps.SaveChanges();
}

function Premissions(GUID, role, username) {
	var admin = new ActiveXObject("COMAdmin.COMAdminCatalog");
	var apps = admin.GetCollection("Applications");
	var roles = apps.GetCollection("Roles", GUID);
	var users = roles.GetCollection("UsersInRole", role);
	users.Populate();
	while(users.Count > 0) {
		users.Remove(0);
	}
	var user = users.Add();
	user.Value("User") = username;
	users.SaveChanges();
}

function ApplicationStop(GUID) {
	var admin = new ActiveXObject("COMAdmin.COMAdminCatalog");
	admin.ShutdownApplication(GUID);
}

function ApplicationUninstall(GUID) {
	var admin = new ActiveXObject("COMAdmin.COMAdminCatalog");
	var apps = admin.GetCollection("Applications");
	apps.Populate();
	for (var i=0;i<apps.Count;i++) {
		if (apps.Item(i).Key.toUpperCase() == GUID.toUpperCase()) {
			apps.Remove(i);
			break;
		}
	}
	apps.SaveChanges();
}

function PasswordGenerate() {
	var passchar = "01234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()<>.,;':\"";
	var pass="";
	for (var i=0;i<16;i++) {
		pass += passchar.charAt(Math.random()*passchar.length);
	}
	return pass;
}

function GroupCreate(name) {
	try {
		GetObject("WinNT://./"+name+",group");
	}
	catch(e) {
		var comp = GetObject("WinNT://.");
		var group = comp.Create("group", name);
		group.SetInfo();
	}
}

function GroupAdd(name, user) {
	var shell = new ActiveXObject("WScript.Network");
	var group = GetObject("WinNT://./"+name+",group");
	try {
		group.Remove("WinNT://"+shell.ComputerName+"/"+user+",user");
	} catch(e) {}
	group.Add("WinNT://"+shell.ComputerName+"/"+user+",user");
	group.SetInfo();
}

function UserCreate(name) {
	try {
		GetObject("WinNT://./"+name+",user");
	}
	catch(e) {
		var comp = GetObject("WinNT://.");
		var user = comp.Create("user", name);
		user.UserFlags = ADS_UF_PSASWD_CANT_CHANGE|ADS_UF_DONT_EXPIRE_PASSWORD;
		user.SetInfo();
	}
}
function UserPassword(name, password) {
	var user = GetObject("WinNT://./"+name+",user");
	user.SetPassword(password);
	user.SetInfo();
}

var OpenVPNUI_Priv_GUID = "{c08893ea-7494-484f-a843-1927ca147866}";
var OpenVPNUI_GUID = "{c08893ea-7494-484f-a843-1927ca147861}";

function main() {
	var command = "invalid";
	var mode = "enterprise";
	
	for (var i=0;i<WScript.Arguments.length;i++) {
		var arg = WScript.Arguments(i);
		if (arg.match(/--command=(.*)/)) {
			command=RegExp.$1;
		}
		if (arg.match(/--mode=(.*)/)) {
			mode=RegExp.$1;
		}
		if (arg.match(/--help/)) {
			WScript.Echo("Usage: install.js --command=install|uninstall|update --mode=enterprise|standalone");
			WScript.Quit(1);
		}
	}

	if (!command.match(/^install$|^uninstall$|^update$/)) {
		WScript.Echo("Invalid command");
		WScript.Quit(1);
	}
	if (!mode.match(/^enterprise$|^standalone$/)) {
		WScript.Echo("Invalid mode");
		WScript.Quit(1);
	}
	
	if (command == "install") {
		var fso = new ActiveXObject("Scripting.FileSystemObject");
		if (!fso.FileExists("OpenVPNUINetwork.dll") || !fso.FileExists("OpenVPNUITunnel.dll")) {
			WScript.Echo("Please place OpenVPNUINetwork.dll, OpenVPNUITunnel.dll at current directory");
			WScript.Quit(1);
		}
	
		WScript.Echo("Creating OpenVPN Users group");
		GroupCreate("OpenVPN Users");
		WScript.Echo("Creating openvpn user");
		UserCreate("openvpn");
		WScript.Echo("Creating openvpn-priv user");
		UserCreate("openvpn-priv");
		WScript.Echo("Adding openvpn-priv user to Network Configuration Operators group");
		GroupAdd("Network Configuration Operators", "openvpn-priv");

		WScript.Echo("Creating OpenVPNUI-Priv application");
		Application(
			OpenVPNUI_Priv_GUID,
			"OpenVPNUI-Priv",
			"Privileged OpenVPNUI objects",
			"OpenVPNUINetwork.dll",
			".\\openvpn-priv",
			"Access"
		);
		WScript.Echo("Creating OpenVPNUI application");
		Application(
			OpenVPNUI_GUID,
			"OpenVPNUI",
			"Non-privileged OpenVPNUI objects",
			"OpenVPNUITunnel.dll",
			".\\openvpn",
			"Access"
		);

		WScript.Echo("\n\nNOTICE: Add your interactive user to OpenVPN Users group and logout/login to take effect\n\n");
		
		command="update";
	}
	if (command == "update") {
		var openvpn_priv_password = PasswordGenerate();
		var openvpn_password = PasswordGenerate();
		UserPassword("openvpn-priv", openvpn_priv_password);
		UserPassword("openvpn", openvpn_password);
		if (mode == "enterprise") {
			WScript.Echo("Mode: Enterprise");
			WScript.Echo("Setting permissions on OpenVPNUI-Priv");
			UserAssign(OpenVPNUI_Priv_GUID, ".\\openvpn-priv", openvpn_priv_password);
			Premissions(OpenVPNUI_Priv_GUID, "Access", ".\\openvpn");
			WScript.Echo("Setting permissions on OpenVPNUI");
			UserAssign(OpenVPNUI_GUID, ".\\openvpn", openvpn_password);
			Premissions(OpenVPNUI_GUID, "Access", ".\\OpenVPN Users");
		}
		else if (mode == "standalone") {
			WScript.Echo("Mode: Standalone");
			WScript.Echo("Setting permissions on OpenVPNUI-Priv");
			UserAssign(OpenVPNUI_Priv_GUID, ".\\openvpn-priv", openvpn_priv_password);
			Premissions(OpenVPNUI_Priv_GUID, "Access", ".\\OpenVPN Users");
			WScript.Echo("Setting permissions on OpenVPNUI");
			UserAssign(OpenVPNUI_GUID, "Interactive User", "");
			Premissions(OpenVPNUI_GUID, "Access", ".\\OpenVPN Users");
		}
		WScript.Echo("Stopping applications");
		ApplicationStop(OpenVPNUI_Priv_GUID);
		ApplicationStop(OpenVPNUI_GUID);
	}
	if (command == "uninstall") {
		WScript.Echo("Uninstalling OpenVPNUI-Priv application");
		ApplicationUninstall(OpenVPNUI_Priv_GUID);
		WScript.Echo("Uninstalling OpenVPNUI application");
		ApplicationUninstall(OpenVPNUI_GUID);
	}
	
	WScript.Quit(0);
}

main();

