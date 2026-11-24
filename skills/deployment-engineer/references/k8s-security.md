# Kubernetes Security Policies Reference

Defense-in-depth configuration patterns for Pod Security Admission (PSA), NetworkPolicies, RBAC, OPA Gatekeeper, and Istio mTLS.

---

## 1. Pod Security Standards (Pod Security Admission)

Enforced at the Namespace level (replaced deprecated `PodSecurityPolicy` in Kubernetes 1.25+):

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

### Restricted Pod SecurityContext
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: myapp:1.0
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
```

---

## 2. NetworkPolicy Templates

### Default Deny All + Explicit Allow DNS & App Traffic
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
```
For external HTTPS egress, block cloud metadata endpoints (`except: [169.254.169.254/32]` on `0.0.0.0/0`).

---

## 3. Least-Privilege RBAC & ServiceAccounts

- Prefer namespace-scoped `Role` and `RoleBinding` over `ClusterRole` / `ClusterRoleBinding`.
- Avoid wildcard (`*`) verbs or resources in production.
- Scope `secrets` / `configmaps` access using `resourceNames` where possible.
- Set `automountServiceAccountToken: false` on pods that do not call the Kubernetes API.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: secret-reader
  namespace: production
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get"]
  resourceNames: ["app-secrets"]
```

---

## 4. Admission Control & Service Mesh (OPA Gatekeeper / Istio)

- **OPA Gatekeeper**: Enforce cluster invariants (required labels, disallowed privileged containers, approved registries) via `ConstraintTemplate` + `Constraint`.
- **Istio mTLS**: Enforce strict mutual TLS (`PeerAuthentication` with `mtls.mode: STRICT`) and identity-scoped `AuthorizationPolicy` rules (`principals: ["cluster.local/ns/production/sa/frontend"]`).

---

## 5. Verification & Troubleshooting Commands

```bash
# Verify CNI / NetworkPolicy configuration
kubectl get nodes -o wide
kubectl describe networkpolicy -n production

# Audit effective ServiceAccount permissions
kubectl auth can-i list pods --as system:serviceaccount:production:my-app
kubectl auth can-i '*' '*' --as system:serviceaccount:production:my-app
```
