// This file contains WATO-specific utility functions.
// This is a way to encapsulate WATO-specific business logic. 

// Sort hostnames such that cluster hostnames appear first
export function hostnameSorter(a: string, b: string) {
    const aIsClusterHostname = a.endsWith(".cluster.watonomous.ca")
    const bIsClusterHostname = b.endsWith(".cluster.watonomous.ca")
    return +bIsClusterHostname - +aIsClusterHostname
}