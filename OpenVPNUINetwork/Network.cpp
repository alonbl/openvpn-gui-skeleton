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
// Network.cpp : Implementation of CNetwork

#include "stdafx.h"
#include <comdef.h>
#include <Iphlpapi.h>
#include "Network.h"

#define MAX_NAME 256
void GetLogonFromToken (HANDLE hToken, _bstr_t& strUser, _bstr_t& strdomain) 
{
	DWORD dwSize = MAX_NAME;
	DWORD dwLength = 0;
	strUser = "";
	strdomain = "";
	PTOKEN_USER ptu = NULL;

	if (
		!GetTokenInformation(
			hToken,         // handle to the access token
			TokenUser,    // get information about the token's groups 
			(LPVOID) ptu,   // pointer to PTOKEN_USER buffer
			0,              // size of buffer
			&dwLength       // receives required buffer size
	)) {
		if (GetLastError() != ERROR_INSUFFICIENT_BUFFER) 
			goto cleanup;

		ptu = (PTOKEN_USER)HeapAlloc(GetProcessHeap(),
		HEAP_ZERO_MEMORY, dwLength);

		if (ptu == NULL)
			goto cleanup;
	}

	if (
		!GetTokenInformation(
			hToken,         // handle to the access token
			TokenUser,    // get information about the token's groups 
			(LPVOID) ptu,   // pointer to PTOKEN_USER buffer
			dwLength,       // size of buffer
			&dwLength       // receives required buffer size
	)) {
		goto cleanup;
	}

	SID_NAME_USE SidType;
	WCHAR lpName[MAX_NAME];
	WCHAR lpDomain[MAX_NAME];

	if( !LookupAccountSid( NULL , ptu->User.Sid, lpName, &dwSize, lpDomain, &dwSize, &SidType ) ) {
		DWORD dwResult = GetLastError();
		if( dwResult != ERROR_NONE_MAPPED ) {
			SetLastError(dwResult);
			goto cleanup;
		}
		
		wcscpy (lpName, L"NONE_MAPPED" );
	}
	else {
		strUser = lpName;
		strdomain = lpDomain;
	}

	SetLastError(ERROR_SUCCESS);

cleanup:

	HRESULT hr = HRESULT_FROM_WIN32(GetLastError());

	if (ptu != NULL) {
		HeapFree(GetProcessHeap(), 0, (LPVOID)ptu);
	}

	if (hr != S_OK) {
		throw new _com_error(hr);
	}
}

static void GetUserFromProcess(_bstr_t& strUser, _bstr_t& strdomain)
{
    HANDLE hProcess = GetCurrentProcess();
    HANDLE hToken = NULL;

	try {
		try {
			if( !OpenProcessToken( hProcess, TOKEN_QUERY, &hToken ) ) {
				throw _com_error(HRESULT_FROM_WIN32(GetLastError()));
			}
		    
			GetLogonFromToken (hToken, strUser,  strdomain);

			CloseHandle(hToken);
			hToken = NULL;
			
			throw 0;
		}
		catch(...) {	// finally
			if (hToken != NULL) {
				CloseHandle(hToken);
				hToken = NULL;
			}
			throw;
		}
	}
	catch(int) {}
}

// CNetwork


STDMETHODIMP CNetwork::GetIdentity(BSTR* User)
{
	try {
		_bstr_t user, domain;
		GetUserFromProcess(user, domain);
		
		*User = user.Detach();
		return S_OK;
	}
	catch(const _com_error &e) {
		return Error(e.ErrorMessage(), __uuidof(INetwork), e.Error());
	}
}

static void set_ipforwardraw(MIB_IPFORWARDROW *fr, LONG InterfaceIndex, LONG Network, LONG Netmask, LONG Gateway) {
	ZeroMemory(fr, sizeof(*fr));
	fr->dwForwardDest = htonl (Network);
	fr->dwForwardMask = htonl (Netmask);
	fr->dwForwardPolicy = 0;
	fr->dwForwardNextHop = htonl (Gateway);
	fr->dwForwardIfIndex = InterfaceIndex;
	fr->dwForwardType = 4;  /* the next hop is not the final dest */
	fr->dwForwardProto = 3; /* PROTO_IP_NETMGMT */
	fr->dwForwardAge = 0;
	fr->dwForwardNextHopAS = 0;
	fr->dwForwardMetric1 = 1;
	fr->dwForwardMetric2 = ~0;
	fr->dwForwardMetric3 = ~0;
	fr->dwForwardMetric4 = ~0;
	fr->dwForwardMetric5 = ~0;
}

STDMETHODIMP CNetwork::RouteCreate(LONG InterfaceIndex, LONG Network, LONG Netmask, LONG Gateway)
{
	HRESULT hr;
	try {
		MIB_IPFORWARDROW fr;

		set_ipforwardraw(&fr, InterfaceIndex, Network, Netmask, Gateway);

		if ((hr = HRESULT_FROM_WIN32(CreateIpForwardEntry (&fr))) != S_OK) {
			throw new _com_error(hr);
		}
		
		return S_OK;
	}
	catch(const _com_error &e) {
		return Error(e.ErrorMessage(), __uuidof(INetwork), e.Error());
	}
}

STDMETHODIMP CNetwork::RouteDelete(LONG InterfaceIndex, LONG Network, LONG Netmask, LONG Gateway)
{
	HRESULT hr;
	try {
		MIB_IPFORWARDROW fr;

		set_ipforwardraw(&fr, InterfaceIndex, Network, Netmask, Gateway);

		if ((hr = HRESULT_FROM_WIN32(DeleteIpForwardEntry (&fr))) != S_OK) {
			throw new _com_error(hr);
		}
		
		return S_OK;
	}
	catch(const _com_error &e) {
		return Error(e.ErrorMessage(), __uuidof(INetwork), e.Error());
	}
}
