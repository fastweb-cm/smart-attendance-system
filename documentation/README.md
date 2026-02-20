# Smart Attendance System

## Terminal Provisioning & Activation

The General assumption for this is that the terminal pcs and the central pc must be in the same network and the central is configured with a static IP addr.

### Step 1: Create Terminal in Central System

Create terminal in central admin panel, provide the terminal name, activation code (hashed and stored in db), etc

### Step 2: Install Terminal Application (Manual Setup)

On each terminal PC:

- Install the required runtime.
- Install the terminal application.
- Start the terminal app.

When launched for the first time, it should display:

- Termninal Not Registered
- Enter Activation Code

### Step 3: Terminal Activation

On the terminal PC:

1. Enter the Activation Code.
2. Terminal sends request to central API.

### Step 4: Central Server Validation

Central server verifies:

- Activation code.
- Status Pending.
  If Valid central then updates terminal status to active and returns the terminal response.
  An object which creates the terminal config file and saves the response object.

### Step 5: Terminal Bootstraps itself

After successful activation, terminal:

1. Creates local(cached) DB.
2. Pulls initial data.
   - Users
   - Biometric templates
   - etc
3. Switches UI to operational mode.
