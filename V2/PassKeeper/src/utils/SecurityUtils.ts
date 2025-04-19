import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Buffer } from 'buffer';
import Aes from 'react-native-aes-crypto';

/**
 * Clase de utilidad para operaciones de seguridad como hash, salt, cifrado y descifrado
 */
export class SecurityUtils {
  private static readonly ALGORITHM = 'AES';
  private static readonly SALT_LENGTH = 16;
  private static readonly IV_LENGTH = 16;

  /**
   * Genera un salt aleatorio de 16 bytes
   * 
   * @returns Una cadena Base64 que representa el salt generado
   */
  public static async generateSalt(): Promise<string> {
    try {
      // Use Crypto.getRandomBytesAsync instead of Random.getRandomBytesAsync
      const randomBytes = await Crypto.getRandomBytesAsync(this.SALT_LENGTH);
      // Convertir a Base64
      return Buffer.from(randomBytes).toString('base64');
    } catch (error) {
      console.error('Error al generar el salt:', error);
      throw new Error('Error al generar el salt');
    }
  }

  /**
   * Genera un hash de la contraseña utilizando el salt proporcionado
   * 
   * @param password La contraseña a hashear
   * @param salt El salt a utilizar
   * @returns Una cadena Base64 que representa el hash generado
   */
  public static async hashPassword(password: string, salt: string): Promise<string> {
    try {
      // Combinar contraseña y salt
      const passwordWithSalt = password + salt;

      // Generar hash SHA-256
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        passwordWithSalt
      );

      return digest;
    } catch (error) {
      console.error('Error al hashear la contraseña:', error);
      throw new Error('Error al hashear la contraseña');
    }
  }

  /**
   * Verifica si la contraseña coincide con el hash almacenado
   * 
   * @param inputPassword La contraseña proporcionada por el usuario
   * @param storedHash El hash almacenado en la base de datos
   * @param salt El salt del usuario
   * @returns true si la contraseña coincide, false en caso contrario
   */
  public static async checkPassword(
    inputPassword: string,
    storedHash: string,
    salt: string
  ): Promise<boolean> {
    try {
      const inputHash = await this.hashPassword(inputPassword, salt);
      return inputHash === storedHash;
    } catch (error) {
      console.error('Error al verificar la contraseña:', error);
      throw new Error('Error al verificar la contraseña');
    }
  }

  /**
   * Genera una contraseña aleatoria segura
   * 
   * @param length Longitud de la contraseña a generar
   * @returns La contraseña generada
   */
  public static async generateRandomPassword(length: number): Promise<string> {
    try {
      const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=<>?";
      // Use Crypto.getRandomBytesAsync instead of Random.getRandomBytesAsync
      const randomBytes = await Crypto.getRandomBytesAsync(length);
      let password = '';

      for (let i = 0; i < length; i++) {
        // Usar cada byte aleatorio para seleccionar un carácter del charset
        const index = randomBytes[i] % charset.length;
        password += charset.charAt(index);
      }

      return password;
    } catch (error) {
      console.error('Error al generar contraseña aleatoria:', error);
      throw new Error('Error al generar contraseña aleatoria');
    }
  }

  /**
   * Almacena de forma segura un valor en el almacenamiento seguro del dispositivo
   * 
   * @param key La clave para almacenar el valor
   * @param value El valor a almacenar
   */
  public static async secureStore(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error al almacenar de forma segura:', error);
      throw new Error('Error al almacenar de forma segura');
    }
  }

  /**
   * Recupera un valor almacenado de forma segura
   * 
   * @param key La clave del valor a recuperar
   * @returns El valor almacenado o null si no existe
   */
  public static async secureRetrieve(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error al recuperar valor seguro:', error);
      throw new Error('Error al recuperar valor seguro');
    }
  }

  /**
   * Elimina un valor almacenado de forma segura
   * 
   * @param key La clave del valor a eliminar
   */
  public static async secureDelete(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error al eliminar valor seguro:', error);
      throw new Error('Error al eliminar valor seguro');
    }
  }

  /**
   * Genera un vector de inicialización (IV) aleatorio para el cifrado AES
   * 
   * @returns Una cadena Base64 que representa el IV generado
   */
  public static async generateIV(): Promise<string> {
    try {
      // Use Crypto.getRandomBytesAsync instead of Random.getRandomBytesAsync
      const randomBytes = await Crypto.getRandomBytesAsync(this.IV_LENGTH);
      return Buffer.from(randomBytes).toString('base64');
    } catch (error) {
      console.error('Error al generar el IV:', error);
      throw new Error('Error al generar el IV');
    }
  }

  /**
   * Cifra datos utilizando AES-256-CBC con un salt y un IV
   * 
   * @param data Los datos a cifrar
   * @param salt El salt para la clave de cifrado
   * @returns Un objeto con los datos cifrados y el IV utilizado
   */
  public static async encrypt(data: string, salt: string): Promise<{ encryptedData: string, iv: string }> {
    try {
      // Generar un IV aleatorio para cada operación de cifrado
      const iv = await this.generateIV();
      const ivBase64 = Buffer.from(iv, 'base64').toString('hex');

      // Generar clave a partir del salt
      const key = await Aes.pbkdf2(salt, salt, 5000, 256, 'sha256');

      // Cifrar los datos
      const encryptedData = await Aes.encrypt(data, key, ivBase64, 'aes-256-cbc');

      return {
        encryptedData,
        iv
      };
    } catch (error) {
      console.error('Error al cifrar datos:', error);
      throw new Error('Error al cifrar datos');
    }
  }

  /**
   * Descifra datos utilizando AES-256-CBC con un salt y un IV
   * 
   * @param encryptedData Los datos cifrados
   * @param salt El salt utilizado para la clave de cifrado
   * @param iv El vector de inicialización utilizado durante el cifrado
   * @returns Los datos descifrados
   */
  public static async decrypt(encryptedData: string, salt: string, iv: string): Promise<string> {
    try {
      const ivBase64 = Buffer.from(iv, 'base64').toString('hex');

      // Generar clave a partir del salt
      const key = await Aes.pbkdf2(salt, salt, 5000, 256, 'sha256');

      // Descifrar los datos
      const decryptedData = await Aes.decrypt(encryptedData, key, ivBase64, 'aes-256-cbc');

      return decryptedData;
    } catch (error) {
      console.error('Error al descifrar datos:', error);
      throw new Error('Error al descifrar datos');
    }
  }
}
