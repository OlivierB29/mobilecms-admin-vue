import hash from 'fast-sha256';

import { Base64 } from './base64';

export class HashUtils {

    /**
     * Hash an input string password to a sha256 password.
     * Explanation : this is just a client hash. The backend API has its own encrypt features.
     * For the backend API, the hashed password is like the clear password.
     * @param password clear text password
     * @return a sha256 in string format
     */
    public hash(password: string): string {
          const uint8array = new TextEncoder().encode(password);
          const myarray = hash(uint8array);
          return new TextDecoder().decode(myarray as Uint8Array);

    }

    /**
    * same as previous + base64 encode
    */
    public hash64(password: string): string {

           return new Base64().encode(this.hash(password));
    }
}
