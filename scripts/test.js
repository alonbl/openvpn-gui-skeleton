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

var shell = new ActiveXObject("WScript.Shell");

function exec(cmd) {
	var e = shell.Exec(cmd);
	while(e.Status == 0) {
		WScript.Sleep(500);
	}
	WScript.Echo(e.StdOut.ReadAll());
}


try{
	WScript.Echo("\n\nTrying to access OpenVPNUI.Network directly");
	WScript.Echo("Creating OpenVPNUI.Network");
	var net = new ActiveXObject("OpenVPNUI.Network");
	WScript.Echo("OpenVPNUI.Network identity is: " + net.GetIdentity());
	WScript.Echo("Creating Route for 1.0.0.0");
	net.RouteCreate(2, 0x01000000, 0x01000000, 0x02000000);
	exec("route print");
	WScript.Echo("Deleting Route for 1.0.0.0");
	net.RouteDelete(2, 0x01000000, 0x01000000, 0x02000000);
	exec("route print");
}
catch(e) {
	WScript.Echo("ERROR: " + e.description);
}

try{
	WScript.Echo("\n\nTrying to access OpenVPNUI.Tunnel");
	WScript.Echo("Creating OpenVPNUI.Tunnel");
	var tunnel = new ActiveXObject("OpenVPNUI.Tunnel");
	WScript.Echo("OpenVPNTunnel identity is: " + tunnel.GetIdentity());
	WScript.Echo("Creating Route for 1.0.0.0");
	tunnel.RouteCreate(2, 0x01000000, 0x01000000, 0x02000000);
	exec("route print");
	WScript.Echo("Deleting Route for 1.0.0.0");
	tunnel.RouteDelete(2, 0x01000000, 0x01000000, 0x02000000);
	exec("route print");
}
catch(e) {
	WScript.Echo("ERROR: " + e.description);
}
