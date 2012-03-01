// dllmain.h : Declaration of module class.

class COpenVPNUINetworkModule : public CAtlDllModuleT< COpenVPNUINetworkModule >
{
public :
	DECLARE_LIBID(LIBID_OpenVPNUINetworkLib)
	DECLARE_REGISTRY_APPID_RESOURCEID(IDR_OPENVPNUINETWORK, "{043660AF-67C6-47C5-AB52-B0AA00B2DA17}")
};

extern class COpenVPNUINetworkModule _AtlModule;
