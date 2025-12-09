import subprocess
import os

def run(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error running {cmd}: {result.stderr}")
        return False
    return True

def get_status():
    return subprocess.check_output("git status --porcelain", shell=True).decode().splitlines()

def commit(file, msg):
    print(f"Committing {file}...")
    run(f'git add "{file}"')
    run(f'git commit -m "{msg}"')

files = get_status()
# Filter out "?? " prefix
files = [f[3:] for f in files if f.startswith("?? ")]

ui_files = [f for f in files if f.startswith("components/ui/")]
root_configs = [f for f in files if "/" not in f and (f.endswith(".json") or f.endswith(".js") or f.endswith(".mjs") or f.endswith(".ts") or f.startswith("."))]
app_files = [f for f in files if f.startswith("app/")]
comp_files = [f for f in files if f.startswith("components/") and not f.startswith("components/ui/")]
lib_files = [f for f in files if f.startswith("lib/")]
prisma_files = [f for f in files if f.startswith("prisma/")]

# 1. Root Configs (Grouped or Individual?) - User said "commits per files". Let's do individual for major ones.
for f in root_configs:
    if f == ".gitignore": commit(f, "chore: add gitignore")
    elif f == "package.json": commit(f, "chore: add package.json")
    elif f == "README.md": commit(f, "docs: add readme")
    else: commit(f, f"chore: add {f}")

# 2. Prisma
for f in prisma_files:
    commit(f, "feat: setup database schema and seeds")

# 3. Libs
for f in lib_files:
    fname = os.path.basename(f)
    commit(f, f"feat: add {fname} utility")

# 4. UI Components (Grouped)
if ui_files:
    # staging all ui files
    for f in ui_files:
        run(f'git add "{f}"')
    run('git commit -m "feat: add shadcn ui design system"')

# 5. Core Components
for f in comp_files:
    fname = os.path.basename(f).replace(".tsx", "")
    commit(f, f"feat: add {fname} component")

# 6. App Routes
for f in app_files:
    commit(f, f"feat: implement {f} route")

# 7. Remaining (public, etc)
remaining = [f for f in files if f not in ui_files + root_configs + app_files + comp_files + lib_files + prisma_files]
for f in remaining:
    commit(f, f"chore: add {f}")

print("Done committing.")
