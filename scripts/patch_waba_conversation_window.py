#!/usr/bin/env python3
import subprocess

def main():
    local_path = "/Users/ratan/Developer/waba-nodejs/WABA-APP/index-waba.js"
    with open(local_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Add /api/conversation-window to GET_AUTH_EXEMPT_PREFIXES
    old_exempt = "const GET_AUTH_EXEMPT_PREFIXES = ['/api/health', '/webhook', '/api/callback', '/api/media-download', '/api/payment/renewal-info', '/api/tenant'];"
    new_exempt = "const GET_AUTH_EXEMPT_PREFIXES = ['/api/health', '/webhook', '/api/callback', '/api/media-download', '/api/payment/renewal-info', '/api/tenant', '/api/conversation-window'];"

    if old_exempt in content:
        content = content.replace(old_exempt, new_exempt)
        with open(local_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated GET_AUTH_EXEMPT_PREFIXES in local index-waba.js")

    pem_path = "/Users/ratan/Developer/waba-nodejs/WABA-APP/sagar.pem"
    remote_host = "ubuntu@52.55.110.32"
    remote_file = "/home/ubuntu/waba-nodejs/WABA-APP/index-waba.js"

    print("Uploading updated index-waba.js to remote server...")
    cmd_scp = f"scp -i {pem_path} -o StrictHostKeyChecking=no {local_path} {remote_host}:{remote_file}"
    subprocess.check_call(cmd_scp, shell=True)

    print("Validating syntax with node --check on remote server...")
    cmd_check = f"ssh -i {pem_path} -o StrictHostKeyChecking=no {remote_host} 'node --check {remote_file}'"
    subprocess.check_call(cmd_check, shell=True)

    print("Reloading PM2 waba-app...")
    cmd_reload = f"ssh -i {pem_path} -o StrictHostKeyChecking=no {remote_host} 'pm2 reload waba-app'"
    subprocess.check_call(cmd_reload, shell=True)

    print("SUCCESS: Remote waba-app reloaded with exempt conversation-window endpoint!")

if __name__ == "__main__":
    main()
