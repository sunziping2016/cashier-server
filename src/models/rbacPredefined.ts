import {RBACPredefined} from './rbac';

const predefined: RBACPredefined = {
  permissions: [
    ['permission', 'create', '创建权限', '创建一种新的权限'],
    ['permission', 'read', '读取权限', '读取权限信息'],
    ['permission', 'list', '列出所有权限', '获取权限列表'],
    ['permission', 'update', '更新权限', '更新权限信息'],
    ['permission', 'delete', '删除权限', '删除某种权限'],
    ['role', 'create', '创建角色', '创建一个新的角色'],
    ['role', 'read', '读取角色', '读取角色信息'],
    ['role', 'list', '列出所有角色', '获取角色列表'],
    ['role', 'update', '更新角色', '更新角色信息'],
    ['role', 'delete', '删除角色', '删除某个角色'],
    ['user', 'create', '创建用户', '创建一个新的用户'],
    ['user', 'read', '读取用户', '读取用户信息'],
    ['user', 'list', '列出所有用户', '获取用户列表'],
    ['user', 'update', '更新用户', '更新用户信息'],
    ['user', 'updateSelf', '更新自己', '更新自己的用户信息'],
    ['user', 'delete', '删除用户', '删除某个用户'],
    ['token', 'acquireByUsername', '请求认证', '通过用户名登录'],
    ['token', 'acquireByEmail', '请求认证', '通过邮箱登录'],
    ['token', 'resume', '请求认证', '续期'],
  ],
  roles: [
    ['permissionAndRoleAdmin', [
      ['permission', 'create'],
      ['permission', 'read'],
      ['permission', 'list'],
      ['permission', 'update'],
      ['permission', 'delete'],
      ['role', 'create'],
      ['role', 'read'],
      ['role', 'list'],
      ['role', 'update'],
      ['role', 'delete'],
    ], '权限角色管理员', '管理权限和角色（随意更改可能会导致站点异常）'],
    ['userAdmin', [
      ['permission', 'read'],
      ['permission', 'list'],
      ['role', 'read'],
      ['role', 'list'],
      ['user', 'create'],
      ['user', 'read'],
      ['user', 'list'],
      ['user', 'update'],
      ['user', 'delete'],
    ], '用户管理员', '管理用户及其权限'],
    ['user', [
      ['user', 'updateSelf'],
    ], '普通用户', '最普通的用户'],
    ['default', [
      ['token', 'acquireByUsername'],
      ['token', 'acquireByEmail'],
      ['token', 'resume'],
    ], '默认权限', '所有人都有的权限'],
  ],
  users: [
    ['superuser', 'superuser', [
      'permissionAndRoleAdmin',
      'userAdmin',
      'user',
    ]],
  ],
};

export default predefined;
