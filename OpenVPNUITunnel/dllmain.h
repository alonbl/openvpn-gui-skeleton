// dllmain.h : Declaration of module class.

class COpenVPNUITunnelModule : public CAtlDllModuleT< COpenVPNUITunnelModule >
{
public :
	DECLARE_LIBID(LIBID_OpenVPNUITunnelLib)
	DECLARE_REGISTRY_APPID_RESOURCEID(IDR_OPENVPNUITUNNEL, "{452CA1DD-5F40-4722-9107-A882D6382AB0}")
};

extern class COpenVPNUITunnelModule _AtlModule;
