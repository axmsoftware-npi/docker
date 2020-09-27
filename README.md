

# requirements:
 - installed kubectl:
    Download the latest release:
    ```
    curl -LO "https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/darwin/amd64/kubectl"
   ```   
    Make the kubectl binary executable.
    ```
    chmod +x ./kubectl
    ```
    Move the binary in to your PATH.
    ```
    sudo mv ./kubectl /usr/local/bin/kubectl
    ```
    Test to ensure the version you installed is up-to-date:
    ```
    kubectl version
   ```
- install helm2
   ```
     curl -LO "https://get.helm.sh/helm-v2.16.12-darwin-amd64.tar.gz" 
   ```
  Extract tar
  ```
     tar -zxvf helm-v2.0.0-linux-amd64.tgz
  ```
  Move the binary in to your PATH.
  ```
     sudo mv linux-amd64/helm /usr/local/bin/helm
  ```
  Make the helm binary executable.
  ```
     sudo chmod +x /usr/local/bin/helm
  ```
     From there, you should be able to run the client:
   ``` 
     helm help
   ```
  
- create kubeconfig:
   ```
    gcloud container clusters get-credentials inovio-k8s --region europe-west3 --project inovio
   ```
- Test to ensure that kubeconfig was added:
   ```
    kubectl get pods
  ```  
 - install nginx ingress controller https://cloud.google.com/community/tutorials/nginx-ingress-gke
   some basic steps:
    * install helm to your cluster https://helm.sh/docs/intro/install/
       ```
       kubectl create serviceaccount --namespace kube-system tiller
       kubectl create clusterrolebinding tiller-cluster-rule --clusterrole=cluster-admin --serviceaccount=kube-system:tiller
       helm init --service-account tiller
       ```
       to make sure that tiller is installed:
       	```
       	kubectl get deployments -n kube-system | grep tiller-deploy
       	```
    * install nginx ingress controller
      	```
      	helm install --name nginx-ingress stable/nginx-ingress --set rbac.create=true --set controller.publishService.enabled=true
      	```
      to make sure that nginx ingress controller is installed:
      	```
      	kubectl get service nginx-ingress-controller
      	```
      you should see the following:
      	You should see the following:
		```
		NAME                       TYPE           CLUSTER-IP     EXTERNAL-IP      PORT(S)                      AGE
		nginx-ingress-controller   LoadBalancer   some_private_ip some_public_ip   80:30890/TCP,443:30258/TCP   3m
		```
 - install external dns controller https://github.com/kubernetes-sigs/external-dns/blob/master/docs/tutorials/nginx-ingress.md
 	* apply the followin manifest from this manual with your values
 	  ```
 	  https://github.com/kubernetes-sigs/external-dns/blob/master/docs/tutorials/nginx-ingress.md#deploy-externaldns
      ```

- install cert manager with letsencrypt https://cert-manager.io/docs/installation/kubernetes/

	*    Install the CustomResourceDefinition resources separately:
	    ```
	     kubectl apply --validate=false -f https://raw.githubusercontent.com/jetstack/cert-manager/release-0.12/deploy/manifests/00-crds.yaml
	    ```
	*    Create the namespace for manager:
	    ```
	    kubectl create namespace cert-manager
	    ```
	*    Add helm repo:
	    ```
	    helm repo add jetstack https://charts.jetstack.io
	    ```
	*    Update local charts repo:
	    ```
	    helm repo update
	    ```
	*    Install the cert-manager:
	    ```
	    helm install --name cert-manager --namespace cert-manager --version v0.12.0 jetstack/cert-manager
	    ```
	*   Verify the installation:
	    ```
	    kubectl get pods --namespace cert-manager
		   NAME                                       READY   STATUS    RESTARTS   AGE
		   cert-manager-6bcc9d894d-wwb96              1/1     Running   1          14d
		   cert-manager-cainjector-594fd9cc45-czdwn   1/1     Running   6          14d
		   cert-manager-webhook-785ff8fc78-zrz2t      1/1     Running   0          14d
		```
 	* create issuer for obtaining certs https://cert-manager.io/docs/tutorials/acme/ingress/
 		```
 		kubectl create --edit -f https://netlify.cert-manager.io/docs/tutorials/acme/example/production-issuer.yaml
 		```









