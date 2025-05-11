// This file contains WATO-specific utility functions.
// This is a way to encapsulate WATO-specific business logic. 

function hostnamePriority(hostname: string) {
    if (hostname.endsWith(".ext.watonomous.ca")) {
        return 1
    }
    if (hostname.endsWith(".cluster.watonomous.ca")) {
        return 2
    }
    return 3
}

export function hostnameSorter(a: string, b: string) {
    return hostnamePriority(a) - hostnamePriority(b)
}
