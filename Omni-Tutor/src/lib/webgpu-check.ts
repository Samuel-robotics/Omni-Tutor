export interface DeviceCapabilities {
    webgpuAvailable: boolean;
    estimatedMemoryGB: number;
    batteryLevel: number | null;
    isCharging: boolean | null;
    recommendedModel: "primary" | "premium" | "fallback" | "none";
}

export async function checkDeviceCapabilities(): Promise<DeviceCapabilities> {
    const caps: DeviceCapabilities = {
        webgpuAvailable: false,
        estimatedMemoryGB: 4,
        batteryLevel: null,
        isCharging: null,
        recommendedModel: "none",
    };

    // Check WebGPU
    if (typeof navigator !== "undefined" && "gpu" in navigator) {
        try {
            const adapter = await (navigator as any).gpu.requestAdapter();
            if (adapter) {
                caps.webgpuAvailable = true;
            }
        } catch {
            caps.webgpuAvailable = false;
        }
    }

    // Estimate memory
    if (typeof navigator !== "undefined" && "deviceMemory" in navigator) {
        caps.estimatedMemoryGB = (navigator as any).deviceMemory || 4;
    }

    // Check battery
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
        try {
            const battery = await (navigator as any).getBattery();
            caps.batteryLevel = battery.level;
            caps.isCharging = battery.charging;
        } catch {
            // Battery API not available
        }
    }

    // Recommend model
    if (!caps.webgpuAvailable) {
        caps.recommendedModel = "none";
    } else if (caps.estimatedMemoryGB >= 8) {
        caps.recommendedModel = "premium";
    } else if (caps.estimatedMemoryGB >= 4) {
        caps.recommendedModel = "primary";
    } else {
        caps.recommendedModel = "fallback";
    }

    return caps;
}

export function shouldPauseInference(
    batteryLevel: number | null,
    isCharging: boolean | null
): boolean {
    if (batteryLevel === null) return false;
    if (isCharging) return false;
    return batteryLevel < 0.2; // Below 20%
}
