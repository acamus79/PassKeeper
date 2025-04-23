/**
 * Utilidades para manejar operaciones de base de datos con reintentos y transacciones
 */
import { db } from '../database/database';

/**
 * Ejecuta una operación de base de datos con reintentos automáticos en caso de error de bloqueo
 * @param operation Función que realiza la operación de base de datos
 * @param maxRetries Número máximo de reintentos (por defecto 3)
 * @param baseRetryDelay Tiempo base de espera entre reintentos en ms (por defecto 300ms)
 * @returns El resultado de la operación
 */
export async function executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseRetryDelay: number = 300
): Promise<T> {
    let retryCount = 0;
    let lastError: Error | unknown;

    while (retryCount <= maxRetries) {
        try {
            // Añadir un pequeño retraso antes de cada intento para reducir la contención
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            return await operation();
        } catch (error) {
            lastError = error;
            // Verificar si el error es de base de datos bloqueada
            const isLockError = error instanceof Error &&
                (error.message.includes('database is locked') ||
                    error.toString().includes('database is locked'));

            retryCount++;

            if (isLockError && retryCount <= maxRetries) {
                // Calcular tiempo de espera con retroceso exponencial
                const delay = baseRetryDelay * Math.pow(2, retryCount - 1);
                console.log(`Base de datos bloqueada, reintentando en ${delay}ms (intento ${retryCount} de ${maxRetries})`);

                // Esperar antes de reintentar
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Si no es un error de bloqueo o se agotaron los reintentos, propagar el error
                throw error;
            }
        }
    }

    // Este punto solo se alcanza si se agotaron los reintentos
    throw lastError || new Error('Failed after maximum retries');
}

/**
 * Ejecuta una operación dentro de una transacción con reintentos automáticos
 * @param operations Función que contiene las operaciones a ejecutar dentro de la transacción
 * @param maxRetries Número máximo de reintentos (por defecto 3)
 * @returns El resultado de la última operación en la transacción
 */
export async function executeInTransaction<T>(
    operations: () => Promise<T>,
    maxRetries: number = 3
): Promise<T> {
    return executeWithRetry(async () => {
        try {
            // Iniciar transacción
            await db.execAsync('BEGIN TRANSACTION');

            // Ejecutar operaciones
            const result = await operations();

            // Confirmar transacción
            await db.execAsync('COMMIT');

            return result;
        } catch (error) {
            // Revertir transacción en caso de error
            try {
                await db.execAsync('ROLLBACK');
                console.log('Transacción revertida debido a un error');
            } catch (rollbackError) {
                console.error('Error al revertir la transacción:', rollbackError);
            }

            throw error;
        }
    }, maxRetries);
}
