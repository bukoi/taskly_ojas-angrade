import json
import re
import os
from typing import Dict,List,Optional

RBAC_POLICY_FILE = os.path.join(os.path.dirname(__file__), "rbac_policy.json")
UUID_PATTERN = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" 
# Cache policy in memory
_RBAC_POLICY_CACHE: Optional[Dict] = None

def load_rbac_policy() -> Dict:
    global _RBAC_POLICY_CACHE
    if _RBAC_POLICY_CACHE is not None:
        return _RBAC_POLICY_CACHE
    try:
        with open(RBAC_POLICY_FILE, "r") as f:
            _RBAC_POLICY_CACHE = json.load(f)
            return _RBAC_POLICY_CACHE
    except Exception as e:
        print(f"RBAC policy file not loading properly {e}")
        return {}

def build_pattern(pattern_template: str, user_id: Optional[str]) -> Optional[str]:
    """
    Replaces placeholders in pattern with actual values.
    Returns None if required placeholder can't be filled.
    """
    if "{user_id}" in pattern_template:
        if not user_id:
            return None 
        pattern_template = pattern_template.replace(
            "{user_id}", 
            re.escape(user_id)
        )
    return pattern_template

def check_permission(role: str, path: str, method: str, user_id: str = None) -> bool:
    rbac_policy = load_rbac_policy()
    if not rbac_policy.get(role):
        return False
    
    role_config = rbac_policy[role]
    if role_config.get("allow_all"):
        return True
    
    permissions = role_config.get("permissions", [])
    for permission in permissions:
        # 1. Match Path
        pattern_template = permission["path_pattern"]
        final_pattern = build_pattern(pattern_template, user_id)
        if final_pattern is None:
            continue
        
        if not re.match(final_pattern, path):
            continue

        # 2. Match Method
        allowed_methods = permission.get("method", [])
        if method not in allowed_methods and "*" not in allowed_methods:
            continue

        # 3. Ownership Check (if specified)
        ownership = permission.get("ownership")
        if ownership == "user_id":
            if not user_id:
                continue
            uuid_in_path = re.search(UUID_PATTERN, path)
            if not uuid_in_path or uuid_in_path.group() != user_id:
                continue
        
        return True
    
    return False