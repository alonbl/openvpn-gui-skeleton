// Tunnel.h : Declaration of the CTunnel

#pragma once
#include "OpenVPNUITunnel_i.h"
#include "resource.h"       // main symbols
#include <comsvcs.h>



// CTunnel

class ATL_NO_VTABLE CTunnel :
	public CComObjectRootEx<CComSingleThreadModel>,
	public CComCoClass<CTunnel, &CLSID_Tunnel>,
	public IDispatchImpl<ITunnel, &IID_ITunnel, &LIBID_OpenVPNUITunnelLib, /*wMajor =*/ 1, /*wMinor =*/ 0>
{
public:
	CTunnel()
	{
	}

	DECLARE_PROTECT_FINAL_CONSTRUCT()

	HRESULT FinalConstruct()
	{
		return S_OK;
	}

	void FinalRelease()
	{
	}

DECLARE_REGISTRY_RESOURCEID(IDR_TUNNEL)

DECLARE_NOT_AGGREGATABLE(CTunnel)

BEGIN_COM_MAP(CTunnel)
	COM_INTERFACE_ENTRY(ITunnel)
	COM_INTERFACE_ENTRY(IDispatch)
END_COM_MAP()

// ISupportsErrorInfo
	STDMETHOD(InterfaceSupportsErrorInfo)(REFIID riid)
	{
		static const IID* arr[] =
		{
			&IID_ITunnel
		};
		for (int i = 0; i < sizeof(arr) / sizeof(arr[0]); i++)
		{
			if (InlineIsEqualGUID(*arr[i], riid))
				return S_OK;
		}
		return S_FALSE;
	}




// ITunnel
public:
	STDMETHOD(GetIdentity)(BSTR* User);
	STDMETHOD(RouteCreate)(LONG InterfaceIndex, LONG Network, LONG Netmask, LONG Gateway);
	STDMETHOD(RouteDelete)(LONG InterfaceIndex, LONG Network, LONG Netmask, LONG Gateway);
};

OBJECT_ENTRY_AUTO(__uuidof(Tunnel), CTunnel)
