'use strict';

const user = require('../user');
const VALID_MODES = new Set(['public', 'anonymous', 'instructors']);
function normalizeVisibilityMode(mode, anonymous) {
  if (VALID_MODES.has(mode)) {
    return mode;
  }
  return anonymous === true || anonymous === 'true' ? 'anonymous' : 'public';
}
async function isViewerAdmin(uid) {
  if (!parseInt(uid, 10)) {
    return false;
  }
  return await user.isAdministrator(uid);
}
function canViewPost(post, uid, isAdmin) {
  if (!post) {
    return false;
  }
  const mode = normalizeVisibilityMode(post.visibilityMode, post.anonymous);
  if (mode !== 'instructors') {
    return true;
  }
  if (String(uid) === String(post.uid)) {
    return true;
  }
  return !!isAdmin;
}
module.exports = {
  VALID_MODES,
  normalizeVisibilityMode,
  isViewerAdmin,
  canViewPost
};