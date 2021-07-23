/**
 * Issued when an instance is requested but no template 
 *  has been declared in an Application.
 */
export class MissingDeclarationError extends Error {};
/**
 * Issued when an instance has an onConfigure function
 *  but no config could be found.
 */
export class MissingConfigurationError extends Error {};
/**
 * Issues when a hook is called but failes to verify 
 *  the instances current state.
 */
export class BootstrapPhaseError extends Error {};
/**
 * Issues when there is more then one configuration
 *  per target.
 */
export class UnspecificConfigError extends Error {};

/**
 * Issued when information about an instance is requested
 * that is unknown
 */
export class UnknownInstanceError extends Error {};
