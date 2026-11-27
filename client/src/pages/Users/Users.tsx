import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  ShieldAlert, 
  Save, 
  ShoppingCart, 
  Receipt, 
  Package, 
  Boxes, 
  Truck, 
  ShoppingBag, 
  BarChart3, 
  Settings,
  CheckCircle2
} from 'lucide-react';
import api from '../../utils/api';
import './Users.css';

interface Role {
  id: string;
  name: string;
  permissions: any[];
}

interface UserData {
  id: string;
  name: string;
  email: string;
  roleId: string;
  role?: { name: string };
  createdAt: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/rbac/users'),
        api.get('/rbac/roles')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      
      // Auto-select first role if none selected
      if (rolesRes.data.length > 0) {
        setSelectedRole(rolesRes.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch RBAC data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      await api.patch('/rbac/users/role', { userId, roleId });
      fetchData();
      triggerToast();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update user role');
    }
  };

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const togglePermission = (moduleName: string, action: string) => {
    if (!selectedRole) return;
    
    const updatedPermissions = selectedRole.permissions.map(p => {
      if (p.moduleName === moduleName) {
        return { ...p, [action]: !p[action] };
      }
      return p;
    });

    const newSelectedRole = { ...selectedRole, permissions: updatedPermissions };
    setSelectedRole(newSelectedRole);
    
    // Sync back to roles array
    setRoles(prev => prev.map(r => r.id === selectedRole.id ? newSelectedRole : r));
  };

  const selectModuleAll = (moduleName: string) => {
    if (!selectedRole) return;
    const perm = selectedRole.permissions.find(p => p.moduleName === moduleName);
    if (!perm) return;

    const targetVal = !perm.canView;
    const actions = ['canView', 'canCreate', 'canEdit', 'canDelete'];
    
    const updatedPermissions = selectedRole.permissions.map(p => {
      if (p.moduleName === moduleName) {
        const updated = { ...p };
        actions.forEach(a => (updated as any)[a] = targetVal);
        return updated;
      }
      return p;
    });

    const newSelectedRole = { ...selectedRole, permissions: updatedPermissions };
    setSelectedRole(newSelectedRole);
    setRoles(prev => prev.map(r => r.id === selectedRole.id ? newSelectedRole : r));
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await api.patch('/rbac/permissions', {
        roleId: selectedRole.id,
        permissions: selectedRole.permissions
      });
      triggerToast();
    } catch (err) {
      alert('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const moduleGroups = [
    { 
      name: 'Sales Module', 
      modules: [
        { key: 'billing', label: 'Billing', icon: <Receipt size={18} /> },
        { key: 'pos', label: 'POS', icon: <ShoppingCart size={18} />, special: 'toggle' }
      ] 
    },
    { 
      name: 'Inventory Module', 
      modules: [
        { key: 'products', label: 'Products', icon: <Package size={18} /> },
        { key: 'stock', label: 'Stock', icon: <Boxes size={18} /> },
        { key: 'suppliers', label: 'Suppliers', icon: <Truck size={18} /> },
        { key: 'purchases', label: 'Purchases', icon: <ShoppingBag size={18} /> }
      ] 
    },
    { 
      name: 'System Module', 
      modules: [
        { key: 'reports', label: 'Reports', icon: <BarChart3 size={18} /> },
        { key: 'rbac', label: 'Users & Roles', icon: <Settings size={18} /> }
      ] 
    }
  ];

  if (loading) return <div className="rbac-loading">Loading Access Policies...</div>;

  return (
    <div className="rbac-container">
      {showToast && (
        <div className="rbac-toast">
          <CheckCircle2 size={18} />
          <span>Security settings updated and deployed</span>
        </div>
      )}

      <div className="rbac-header">
        <div>
          <h1>User Access Control</h1>
          <p>Define modular permissions and security roles for system operators</p>
        </div>
      </div>

      <div className="rbac-tabs">
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          Staff Members
        </button>
        <button className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>
          Role Management
        </button>
      </div>

      <div className="rbac-content-area">
        {activeTab === 'users' && (
          <div className="user-list-view glass">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>User Information</th>
                  <th>Joined</th>
                  <th>Access Role</th>
                  <th style={{ textAlign: 'right' }}>Role Assignment</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-profile-cell">
                        <div className="user-icon-circle"><User size={16} /></div>
                        <div className="user-text">
                           <div className="name">{u.name}</div>
                           <div className="email">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="date-cell">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                       <span className={`role-pill ${u.role?.name === 'Admin' ? 'admin' : u.role?.name === 'Manager' ? 'manager' : 'cashier'}`}>
                         {u.role?.name}
                       </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                       <select 
                         className="erp-select"
                         value={u.roleId || ''}
                         onChange={(e) => handleRoleChange(u.id, e.target.value)}
                       >
                         <option value="">Select Role...</option>
                         {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                       </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="roles-manager-grid">
            <div className="roles-sidebar card glass">
              <div className="sidebar-header">System Roles</div>
              <div className="roles-scroll">
                {roles.map(r => (
                  <div 
                    key={r.id} 
                    className={`role-nav-item ${selectedRole?.id === r.id ? 'active' : ''}`}
                    onClick={() => setSelectedRole(r)}
                  >
                    <Shield size={18} />
                    <div className="role-nav-text">
                       <div className="name">{r.name}</div>
                       <div className="meta">{r.permissions?.length || 0} Modules Active</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="permissions-editor">
              {selectedRole ? (
                <>
                  <div className="editor-header glass">
                    <div className="role-details">
                       <div className="role-main-badge"><Shield size={24} /></div>
                       <div>
                          <h3>{selectedRole.name} Policy</h3>
                          <p>Define what this role can perform across each module</p>
                       </div>
                    </div>
                    <button className="btn-save-permissions" onClick={savePermissions} disabled={saving}>
                       <Save size={18} /> {saving ? 'Writing...' : 'Save Permissions'}
                    </button>
                  </div>

                  <div className="permissions-grid">
                     {moduleGroups.map(group => (
                       <div key={group.name} className="module-group">
                          <h4 className="group-label">{group.name}</h4>
                          <div className="module-grid">
                             {group.modules.map(mod => {
                               const perm = selectedRole.permissions.find(p => p.moduleName === mod.key);
                               if (!perm) return null;

                               return (
                                 <div key={mod.key} className="permission-card card glass">
                                    <div className="card-header">
                                       <div className="mod-info">
                                          {mod.icon}
                                          <span>{mod.label}</span>
                                       </div>
                                       {!mod.special && (
                                         <button className="text-btn-all" onClick={() => selectModuleAll(mod.key)}>
                                            Select All
                                         </button>
                                       )}
                                    </div>
                                    <div className="card-body">
                                       {mod.special === 'toggle' ? (
                                         <label className="access-toggle">
                                            <input type="checkbox" checked={perm.canView} onChange={() => selectModuleAll(mod.key)} />
                                            <div className="slider"></div>
                                            <span>Full Module Access</span>
                                         </label>
                                       ) : (
                                         <div className="checkbox-grid">
                                            {[
                                              { key: 'canView', label: 'View' },
                                              { key: 'canCreate', label: 'Create' },
                                              { key: 'canEdit', label: 'Edit' },
                                              { key: 'canDelete', label: 'Delete' }
                                            ].map(opt => (
                                              <label key={opt.key} className="perm-checkbox-label">
                                                 <input 
                                                   type="checkbox" 
                                                   checked={(perm as any)[opt.key]} 
                                                   onChange={() => togglePermission(mod.key, opt.key)} 
                                                 />
                                                 <span className="box"></span>
                                                 <span className="label-text">{opt.label}</span>
                                              </label>
                                            ))}
                                         </div>
                                       )}
                                    </div>
                                 </div>
                               )
                             })}
                          </div>
                       </div>
                     ))}
                  </div>
                </>
              ) : (
                <div className="empty-editor glass flex flex-col items-center justify-center">
                   <ShieldAlert size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                   <p>Select a role from the left to configure access control logic</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
