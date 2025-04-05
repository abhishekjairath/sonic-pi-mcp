import { Client } from "node-osc";

const OSC_HOST = process.env.OSC_HOST || '192.168.1.5';
const OSC_PORT = parseInt(process.env.OSC_PORT || '4560');

async function testConnection() {
    console.log(`Testing connection to Sonic Pi at ${OSC_HOST}:${OSC_PORT}`);
    
    const client = new Client(OSC_HOST, OSC_PORT);
    
    // Send a test message
    const testCode = `
    print "Docker test connection successful!"
    use_synth :beep
    play 60
    sleep 0.5
    play 64
    sleep 0.5
    play 67
    `;
    
    try {
        client.send('/run-code', testCode);
        console.log('Test message sent successfully');
        
        // Wait a bit before closing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        client.close();
        console.log('Test completed');
    } catch (error) {
        console.error('Error during test:', error);
        process.exit(1);
    }
}

testConnection(); 