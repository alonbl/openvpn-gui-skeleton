// Network.h : Declaration of the CNetwork

#pragma once
#include "OpenVPNUINetwork_i.h"
#include "resource.h"       // main symbols
#include <comsvcs.h>



// CNetwork

class ATL_NO_VTABLE CNetwork :
	public CComObjectRootEx<CComSingleThreadModel>,
	public CComCoClass<CNetwork, &CLSID_Network>,
	public IDispatchImpl<INetwork, &IID_INetwork, &LIBID_OpenVPNUINetworkLib, /*wMajor =*/ 1, /*wMinor =*/ 0>
{
public:
	CNetwork()
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

DECLARE_REGISTRY_RESOURCEID(IDR_NETWORK)

DECLARE_NOT_AGGREGATABLE(CNetwork)

BEGIN_COM_MAP(CNetwork)
	COM_INTERFACE_ENTRY(INetwork)
	COM_INTERFACE_ENTRY(IDispatch)
END_COM_MAP()

// ISupportsErrorInfo
	STDMETHOD(InterfaceSupportsErrorInfo)(REFIID riid)
	{
		static const IID* arr[] =
		{
			&IID_INetwork
		};
		for (int i = 0; i < sizeof(arr) / sizeof(arr[0]); i++)
		{
			if (InlineIsEqualGUID(*arr[i], riid))
				return S_OK;
		}
		return S_FALSE;
	}




// INetwork
public:
	STDMETHOD(GetIdentity)(BSTR* User);
	STDMETHOD(RouteCreate)(LONG InterfaceIndex, LONG Network, LONG Netmask, LONG Gateway);
	STDMETHOD(RouteDelete)(LONG InterfaceIndex, LONG Network, LONG Netmask, LONG Gateway);
};

OBJECT_ENTRY_AUTO(__uuidof(Network), CNetwork)
