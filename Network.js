//Network.js
//This file contains the code that Holiday Board uses to handle data communications with RDM light fixtures and their corresponding
//ethernet endpoints on a local area network; some prelminary code has been added during initial development during 2023 to support
//the use of Art-Net, but it is not known if Art-Net functionoality will be fully available upon initial release; future support may
//be added to allow the use of ACN (Architecture for Control Networks) protocols

//NOTE: Several of the constants declared hereafter are padded with unnecessary zeros at the beginning of their stated value, but this is
//meant to signify that the underlying value is meant to take up two or more bytes in its respective data block

//Begin Art-Net code block

//Represents the 'Art-Net+{null}' string header at the beginning of Art-Net packets
const ARTNET_ID = "Art-Net" + String.fromCharCode(0);

const OpCode = {
    OpPoll: Symbol(0x2000),
    OpPollReply: Symbol(0x2100),
    OpDiagData: Symbol(0x2300),
    OpCommand: Symbol(0x2400),
    OpDataRequest: Symbol(0x2700),
    OpDataReply: Symbol(0x2800),
    OpOutputOpDmx: Symbol(0x5000),
    OpNzs: Symbol(0x5100),
    OpSync: Symbol(0x5200),
    OpAddress: Symbol(0x6000),
    OpInput: Symbol(0x7000),
    OpTodRequest: Symbol(0x8000),
    OpTodData: Symbol(0x8100),
    OpTodControl: Symbol(0x8200),
    OpRdm: Symbol(0x8300),
    OpRdmSub: Symbol(0x8400),
    OpVideoSetup: Symbol(0xa010),
    OpVideoPalette: Symbol(0xa020),
    OpVideoData: Symbol(0xa040),
    OpMacMaster: Symbol(0xf000),
    OpMacSlave: Symbol(0xf100),
    OpFirmwareMaster: Symbol(0xf200),
    OpFirmwareReply: Symbol(0xf300),
    OpFileTnMaster: Symbol(0xf400),
    OpFileFnMaster: Symbol(0xf500),
    OpFileFnReply: Symbol(0xf600),
    OpIpProg: Symbol(0xf800),
    OpIpProgReply: Symbol(0xf900),
    OpMedia: Symbol(0x9000),
    OpMediaPatch: Symbol(0x9100),
    OpMediaControl: Symbol(0x9200),
    OpMediaControlReply: Symbol(0x9300),
    OpTimeCode: Symbol(0x9700),
    OpTimeSync: Symbol(0x9800),
    OpTrigger: Symbol(0x9900),
    OpDirectory: Symbol(0x9a00),
    OpDirectoryReply: Symbol(0x9b00)
}

const NodeReport = {
    RcDebug: Symbol(0x0000),
    RcPowerOk: Symbol(0x0001),
    RcPowerFail: Symbol(0x0002),
    RcSocketWr1: Symbol(0x0003),
    RcParseFail: Symbol(0x0004),
    RcUdpFail: Symbol(0x0005),
    RcShNameOk: Symbol(0x0006),
    RcLoNameOk: Symbol(0x0007),
    RcDmxError: Symbol(0x0008),
    RcDmxUdpFull: Symbol(0x0009),
    RcDmxRxFull: Symbol(0x000a),
    RcSwitchErr: Symbol(0x000b),
    RcConfigErr: Symbol(0x000c),
    RcDmxShort: Symbol(0x000d),
    RcFirmwareFail: Symbol(0x000e),
    RcUserFail: Symbol(0x000f),
    RcFactoryRes: Symbol(0x0010)
}

const Style = {
    StNode: Symbol(0x00),
    StController: Symbol(0x01),
    StMedia: Symbol(0x02),
    StRoute: Symbol(0x03),
    StBackup: Symbol(0x04),
    StConfig: Symbol(0x05),
    StVisual: Symbol(0x06)
}

const NodeConfigurationCommand = {
    AcNone: Symbol(0x00),
    AcCancelMerge: Symbol(0x01),
    AcLedNormal: Symbol(0x02),
    AcLedMute: Symbol(0x03),
    AcLedLocate: Symbol(0x04),
    AcResetRxFlags: Symbol(0x05),
    AcAnalysisOn: Symbol(0x06),
    AcAnalysisOff: Symbol(0x07),
    AcFailHold: Symbol(0x08),
    AcFailZero: Symbol(0x09),
    AcFailFull: Symbol(0x0A),
    AcFailScene: Symbol(0x0B),
    AcFailRecord: Symbol(0x0C),
    AcMergeLtp0: Symbol(0x10),
    AcMergeLtp1: Symbol(0x11),
    AcMergeLtp2: Symbol(0x12),
    AcMergeLtp3: Symbol(0x13),
    AcDirectionTx0: Symbol(0x20),
    AcDirectionTx1: Symbol(0x21),
    AcDirectionTx2: Symbol(0x22),
    AcDirectionTx3: Symbol(0x23),
    AcDirectionRx0: Symbol(0x30),
    AcDirectionRx1: Symbol(0x31),
    AcDirectionRx2: Symbol(0x32),
    AcDirectionRx3: Symbol(0x33),
    AcMergeHtp0: Symbol(0x50),
    AcMergeHtp1: Symbol(0x51),
    AcMergeHtp2: Symbol(0x52),
    AcMergeHtp3: Symbol(0x53),
    AcArtNetSel0: Symbol(0x60),
    AcArtNetSel1: Symbol(0x61),
    AcArtNetSel2: Symbol(0x62),
    AcArtNetSel3: Symbol(0x63),
    AcAcnSel0: Symbol(0x70),
    AcAcnSel1: Symbol(0x71),
    AcAcnSel2: Symbol(0x72),
    AcAcnSel3: Symbol(0x73),
    AcClearOp0: Symbol(0x90),
    AcClearOp1: Symbol(0x91),
    AcClearOp2: Symbol(0x92),
    AcClearOp3: Symbol(0x93),
    AcStyleDelta0: Symbol(0xA0),
    AcStyleDelta1: Symbol(0xA1),
    AcStyleDelta2: Symbol(0xA2),
    AcStyleDelta3: Symbol(0xA3),
    AcStyleConst0: Symbol(0xB0),
    AcStyleConst1: Symbol(0xB1),
    AcStyleConst2: Symbol(0xB2),
    AcStyleConst3: Symbol(0xB3),
    AcRdmEnable0: Symbol(0xC0),
    AcRdmEnable1: Symbol(0xC1),
    AcRdmEnable2: Symbol(0xC2),
    AcRdmEnable3: Symbol(0xC3),
    AcRdmDisable0: Symbol(0xD0),
    AcRdmDisable1: Symbol(0xD1),
    AcRdmDisable2: Symbol(0xD2),
    AcRdmDisable3: Symbol(0xD3)
}

const DataRequestCode = {
    DrPoll: Symbol(0x0000),
    DrUrlProduct: Symbol(0x0001),
    DrUrlUserGuide: Symbol(0x0002),
    DrUrlSupport: Symbol(0x0003),
    DrUrlPersUdr: Symbol(0x0004),
    DrUrlPersGdtf: Symbol(0x0005)
    //DrManSpec: 0x8000-0xFFFF
}

const PriorityCode = {
    DpLow: Symbol(0x10),
    DpMed: Symbol(0x40),
    DpHigh: Symbol(0x80),
    DpCritical: Symbol(0xE0),
    DpVolatile: Symbol(0xF0)
}

const ArtTriggerKey = {
    KeyAscii: Symbol(0),
    KeyMacro: Symbol(1),
    KeySoft: Symbol(2),
    KeyShow: Symbol(3)
    //Values 4-255 are undefined
}

const VlcFlags = {
    //TODO: Verify that the bit position of the below values is correct
    Ieee: Symbol(0x40),
    Reply: Symbol(0x20),
    Beacon: Symbol(0x10)
}

const ArtFirmwareMasterPacketType = {
    FirmFirst: Symbol(0x00),
    FirmCont: Symbol(0x01),
    FirmLast: Symbol(0x02),
    UbeaFirst: Symbol(0x03),
    UbeaCont: Symbol(0x04),
    UbeaLast: Symbol(0x05)
}

const ArtFirmwareReplyPacketType = {
    FirmBlockGood: Symbol(0x00),
    FirmAllGood: Symbol(0x01),
    FirmFail: Symbol(0xFF),
}

const ArtTodRequestCommand = {
    TodFull: Symbol(0x00)
}

const ArtTodDataCommandResponse = {
    TodFull: Symbol(0x00),
    TodNak: Symbol(0xFF)
}

const ArtTodControlCommand = {
    AtcNone: Symbol(0x00),
    AtcFlush: Symbol(0x01)
}

const ArtRdmCommand = {
    ArProcess: Symbol(0x00)
}

//End Art-Net code block

//Begin RDM code block

//Used to get valid hex digits that can appear in a UID
const RE_HEX_DIGITS = /[0-9a-fA-F]*/g;

//Start Code (Slot 0)
const SC_RDM = 0xCC;

//RDM Protocol Data Structure ID’s (Slot 1)
const SC_SUB_MESSAGE = 0x01;

//Broadcast Device UIDs

//ID used to broadcast to all devices regardless of manufacturer
//Note: This is stored as a string because the UID class solely takes string input for its methods which is then formatted to binary data for transmission
const BROADCAST_ALL_DEVICES_ID = "FFFFFFFFFFFF";

//ALL_DEVICES_ID (Specific Manufacturer ID 0xmmmm) 0xmmmmFFFFFFFF
//Use the UID.getDeviceBroadcastUIDString method to obtain this value

const SUB_DEVICE_ALL_CALL = 0xFFFF;

const CommandClass = {
    DISCOVERY_COMMAND: Symbol(0x10),
    DISCOVERY_COMMAND_RESPONSE: Symbol(0x11),
    GET_COMMAND: Symbol(0x20),
    GET_COMMAND_RESPONSE: Symbol(0x21),
    SET_COMMAND: Symbol(0x30),
    SET_COMMAND_RESPONSE: Symbol(0x31)
}

const ResponseType = {
    RESPONSE_TYPE_ACK: Symbol(0x00),
    RESPONSE_TYPE_ACK_TIMER: Symbol(0x01),
    RESPONSE_TYPE_NACK_REASON: Symbol(0x02),
    RESPONSE_TYPE_ACK_OVERFLOW: Symbol(0x03)
}

const ParameterID = {
    //Category - Network Management
    DISC_UNIQUE_BRANCH: Symbol(0x0001),
    DISC_MUTE: Symbol(0x0002),
    DISC_UN_MUTE: Symbol(0x0003),
    PROXIED_DEVICES: Symbol(0x0010),
    PROXIED_DEVICE_COUNT: Symbol(0x0011),
    COMMS_STATUS: Symbol(0x0015),
    //Category - Status Collection
    QUEUED_MESSAGE: Symbol(0x0020),
    STATUS_MESSAGES: Symbol(0x0030),
    STATUS_ID_DESCRIPTION: Symbol(0x0031),
    CLEAR_STATUS_ID: Symbol(0x0032),
    SUB_DEVICE_STATUS_REPORT_THRESHOLD: Symbol(0x0033),
    //Category - RDM Information
    SUPPORTED_PARAMETERS: Symbol(0x0050),
    PARAMETER_DESCRIPTION: Symbol(0x0051),
    //Category - Product Information
    DEVICE_INFO: Symbol(0x0060),
    PRODUCT_DETAIL_ID_LIST: Symbol(0x0070),
    DEVICE_MODEL_DESCRIPTION: Symbol(0x0080),
    MANUFACTURER_LABEL: Symbol(0x0081),
    DEVICE_LABEL: Symbol(0x0082),
    FACTORY_DEFAULTS: Symbol(0x0090),
    LANGUAGE_CAPABILITIES: Symbol(0x00A0),
    LANGUAGE: Symbol(0x00B0),
    SOFTWARE_VERSION_LABEL: Symbol(0x00C0),
    BOOT_SOFTWARE_VERSION_ID: Symbol(0x00C1),
    BOOT_SOFTWARE_VERSION_LABEL: Symbol(0x00C2),
    //Category - DMX512 Setup
    DMX_PERSONALITY: Symbol(0x00E0),
    DMX_PERSONALITY_DESCRIPTION: Symbol(0x00E1),
    DMX_START_ADDRESS: Symbol(0x00F0),
    SLOT_INFO: Symbol(0x0120),
    SLOT_DESCRIPTION: Symbol(0x0121),
    DEFAULT_SLOT_VALUE: Symbol(0x0122),
    //Category - Sensors
    SENSOR_DEFINITION: Symbol(0x0200),
    SENSOR_VALUE: Symbol(0x0201),
    RECORD_SENSORS: Symbol(0x0202),
    //Category - Dimmer Settings (0x03xx)
    //Note: As of October 2023, no parameters in this category are defined
    //Category - Power/Lamp Settings (0x04xx)
    DEVICE_HOURS: Symbol(0x0400),
    LAMP_HOURS: Symbol(0x0401),
    LAMP_STRIKES: Symbol(0x0402),
    LAMP_STATE: Symbol(0x0403),
    LAMP_ON_MODE: Symbol(0x0404),
    DEVICE_POWER_CYCLES: Symbol(0x0405),
    //Category - Display Settings (0x05xx)
    DISPLAY_INVERT: Symbol(0x0500),
    DISPLAY_LEVEL: Symbol(0x0501),
    //Category - Configuration (0x06xx)
    PAN_INVERT: Symbol(0x0600),
    TILT_INVERT: Symbol(0x0601),
    PAN_TILT_SWAP: Symbol(0x0602),
    REAL_TIME_CLOCK: Symbol(0x603),
    //Category - Control (0x10xx)
    IDENTIFY_DEVICE: Symbol(0x1000),
    RESET_DEVICE: Symbol(0x1001),
    POWER_STATE: Symbol(0x1010),
    PERFORM_SELFTEST: Symbol(0x1020),
    SELF_TEST_DESCRIPTION: Symbol(0x1021),
    CAPTURE_PRESET: Symbol(0x1030),
    PRESET_PLAYBACK: Symbol(0x1031)
    //ESTA Reserved Future RDM Development (0x7FE0-0x7FFF)
    //Manufacturer-Specific PIDs (0x8000-0xFFDF)
    //ESTA Reserved Future RDM Development (0xFFE0-0xFFFF)
}

const StatusType = {
    STATUS_NONE: Symbol(0x00),
    STATUS_GET_LAST_MESSAGE: Symbol(0x01),
    STATUS_ADVISORY: Symbol(0x02),
    STATUS_WARNING: Symbol(0x03),
    STATUS_ERROR: Symbol(0x04),
    STATUS_ADVISORY_CLEARED: Symbol(0x12),
    STATUS_WARNING_CLEARED: Symbol(0x13),
    STATUS_ERROR_CLEARED: Symbol(0x14)
}

const SensorUnitPrefix = {
    PREFIX_NONE: Symbol(0x00),
    PREFIX_DECI: Symbol(0x01),
    PREFIX_CENTI: Symbol(0x02),
    PREFIX_MILLI: Symbol(0x03),
    PREFIX_MICRO: Symbol(0x04),
    PREFIX_NANO: Symbol(0x05),
    PREFIX_PICO: Symbol(0x06),
    PREFIX_FEMPTO: Symbol(0x07),
    PREFIX_ATTO: Symbol(0x08),
    PREFIX_ZEPTO: Symbol(0x09),
    PREFIX_YOCTO: Symbol(0x0A),
    PREFIX_DECA: Symbol(0x11),
    PREFIX_HECTO: Symbol(0x12),
    PREFIX_KILO: Symbol(0x13),
    PREFIX_MEGA: Symbol(0x14),
    PREFIX_GIGA: Symbol(0x15),
    PREFIX_TERRA: Symbol(0x16),
    PREFIX_PETA: Symbol(0x17),
    PREFIX_EXA: Symbol(0x18),
    PREFIX_ZETTA: Symbol(0x19),
    PREFIX_YOTTA: Symbol(0x1A)
}

const DataType = {
    DS_NOT_DEFINED: Symbol(0x00),
    DS_BIT_FIELD: Symbol(0x01),
    DS_ASCII: Symbol(0x02),
    DS_UNSIGNED_BYTE: Symbol(0x03),
    DS_SIGNED_BYTE: Symbol(0x04),
    DS_UNSIGNED_WORD: Symbol(0x05),
    DS_SIGNED_WORD: Symbol(0x06),
    DS_UNSIGNED_DWORD: Symbol(0x07),
    DS_SIGNED_DWORD: Symbol(0x08)
    //Manufacturer-Specific Data Types are values 0x80 – 0xDF
}

const ParameterDescriptionCommandClass = {
    CC_GET: Symbol(0x01),
    CC_SET: Symbol(0x02),
    CC_GET_SET: Symbol(0x03),
}

const ResponseNACKReasonCode = {
    NR_UNKNOWN_PID: Symbol(0x0000),
    NR_FORMAT_ERROR: Symbol(0x0001),
    NR_HARDWARE_FAULT: Symbol(0x0002),
    NR_PROXY_REJECT: Symbol(0x0003),
    NR_WRITE_PROTECT: Symbol(0x0004),
    NR_UNSUPPORTED_COMMAND_CLASS: Symbol(0x0005),
    NR_DATA_OUT_OF_RANGE: Symbol(0x0006),
    NR_BUFFER_FULL: Symbol(0x0007),
    NR_PACKET_SIZE_UNSUPPORTED: Symbol(0x0008),
    NR_SUB_DEVICE_OUT_OF_RANGE: Symbol(0x0009),
    NR_PROXY_BUFFER_FULL: Symbol(0x000A)
}

const StatusMessageID = {
    STS_CAL_FAIL: Symbol(0x0001),
    STS_SENS_NOT_FOUND: Symbol(0x0002),
    STS_SENS_ALWAYS_ON: Symbol(0x0003),
    STS_LAMP_DOUSED: Symbol(0x0011),
    STS_LAMP_STRIKE: Symbol(0x0012),
    STS_OVERTEMP: Symbol(0x0021),
    STS_UNDERTEMP: Symbol(0x0022),
    STS_SENS_OUT_RANGE: Symbol(0x0023),
    STS_OVERVOLTAGE_PHASE: Symbol(0x0031),
    STS_UNDERVOLTAGE_PHASE: Symbol(0x0032),
    STS_OVERCURRENT: Symbol(0x0033),
    STS_UNDERCURRENT: Symbol(0x0034),
    STS_PHASE: Symbol(0x0035),
    STS_PHASE_ERROR: Symbol(0x0036),
    STS_AMPS: Symbol(0x0037),
    STS_VOLTS: Symbol(0x0038),
    STS_DIMSLOT_OCCUPIED: Symbol(0x0041),
    STS_BREAKER_TRIP: Symbol(0x0042),
    STS_WATTS: Symbol(0x0043),
    STS_DIM_FAILURE: Symbol(0x0044),
    STS_DIM_PANIC: Symbol(0x0045),
    STS_READY: Symbol(0x0050),
    STS_NOT_READY: Symbol(0x0051),
    STS_LOW_FLUID: Symbol(0x0052)
}

const SlotType = {
    ST_PRIMARY: Symbol(0x00),
    ST_SEC_FINE: Symbol(0x01),
    ST_SEC_TIMING: Symbol(0x02),
    ST_SEC_SPEED: Symbol(0x03),
    ST_SEC_CONTROL: Symbol(0x04),
    ST_SEC_INDEX: Symbol(0x05),
    ST_SEC_ROTATION: Symbol(0x06),
    ST_SEC_INDEX_ROTATE: Symbol(0x07),
    ST_SEC_UNDEFINED: Symbol(0xFF)
}

//TODO: Add Slot ID Definitions

const SlotID = {
    //Intensity Functions: 0x00xx
    SD_INTENSITY: Symbol(0x0001),
    SD_INTENSITY_MASTER: Symbol(0x0002),
    //Movement Functions: 0x01xx
    SD_PAN: Symbol(0x0101),
    SD_TILT: Symbol(0x0102),
    //Color Functions: 0x02xx
    SD_COLOR_WHEEL: Symbol(0x0201),
    SD_COLOR_SUB_CYAN: Symbol(0x0202),
    SD_COLOR_SUB_YELLOW: Symbol(0x0203),
    SD_COLOR_SUB_MAGENTA: Symbol(0x0204),
    SD_COLOR_ADD_RED: Symbol(0x0205),
    SD_COLOR_ADD_GREEN: Symbol(0x0206),
    SD_COLOR_ADD_BLUE: Symbol(0x0207),
    SD_COLOR_CORRECTION: Symbol(0x0208),
    SD_COLOR_SCROLL: Symbol(0x0209),
    SD_COLOR_SEMAPHORE: Symbol(0x0210),
    //Image Functions: 0x03xx
    SD_STATIC_GOBO_WHEEL: Symbol(0x0301),
    SD_ROTO_GOBO_WHEEL: Symbol(0x0302),
    SD_PRISM_WHEEL: Symbol(0x0303),
    SD_EFFECTS_WHEEL: Symbol(0x0304),
    //Beam Functions: 0x04xx
    SD_BEAM_SIZE_IRIS: Symbol(0x0401),
    SD_EDGE: Symbol(0x0402),
    SD_FROST: Symbol(0x0403),
    SD_STROBE: Symbol(0x0404),
    SD_ZOOM: Symbol(0x0405),
    SD_FRAMING_SHUTTER: Symbol(0x0406),
    SD_SHUTTER_ROTATE: Symbol(0x0407),
    SD_DOUSER: Symbol(0x0408),
    SD_BARN_DOOR: Symbol(0x0409),
    //Control Functions: 0x05xx
    SD_LAMP_CONTROL: Symbol(0x0501),
    SD_FIXTURE_CONTROL: Symbol(0x0502),
    SD_FIXTURE_SPEED: Symbol(0x0503),
    SD_MACRO: Symbol(0x0504),
    SD_UNDEFINED: Symbol(0xFFFF)
}

class Endpoint {
    constructor(name, portCount, host) {
        this.name = name;
        this.portCount = portCount;
        this.host = host;
    }

    /*Checks a provided JSON Endpoint object to determine if name, port count, and host name/IP address are present, and are a string, number, and string, respectively; this method
    does not check for duplicates Endpoint objects with the same name in the JSON Endpoint array - this is handled by the JSON intake method instead*/
    //TODO: Review making method return something other than a boolean value (such as numeric) in order to denote either missing values or type mismatches (one or the other)
    static isJSONObjectValid(jsonEndpoint) {
        if ((typeof jsonEndpoint.name == "string") && (typeof jsonEndpoint.portCount == "number") && (typeof jsonEndpoint.host == "string"))
        {
            return true;
        }
        else { return false; }
    }
}

class Fixture {
    constructor(name, endpoint, uidString) {
        this.name = name;
        this.endpoint = endpoint;
        this.port = port;
        //TODO: Provide validation mechanism for UID strings
        this.uid = new UID(uidString);
    }
}

//Represents an RDM packet, either one sent or received
class RDMPacket {
    static getBinaryString(destUID, srcUID, transactNum, port, msgCount, subDevice, cmdClass, paramID, paramData) {
        /*
        destUID (string): Represents the destination UID of this packet; converts to six unsigned 8-bit integers by use of an ad hoc ArrayBuffer object
        srctUID (string): Represents the source UID of this packet; converts to six unsigned 8-bit integers by use of an ad hoc ArrayBuffer object
        transactNum (integer): Represents the transaction number of the packet; converts to an unsigned 8-bit integer
        port (integer): Represents the port number of the specified endpoint; converts to an unsigned 8-bit integer
        msgCount (integer): Represents the message count of the packet being created; this should always be set to zero when using this method to create controller-generated messages; converts to an unsigned 8-bit integer
        subDevice (integer): Represents the numbered ID of a sub-device; converts to a big-endian unsigned 16-bit integer
        cmdClass (CommandClass [integer]): Represents the type of command message (command class) being sent; converts to an unsigned 8-bit integer
        paramID (integer): Represents the numbered parameter being sent; converts to a big-endian unsigned 16-bit integer
        paramData (ArrayBuffer): Variable length value that represents the actual data to be sent, corresponding with the specified parameter (parameter ID); converts to a series of zero or more unsigned 8-bit integers
        */

        var returnBuffer = new ArrayBuffer(paramData.byteLength + 22);
        var bufferView = new DataView(returnBuffer);

        //Set the start code, which is always 0xCC
        bufferView.setUint8(0, SC_RDM)

        //Set the sub-start code, which is always 0x01
        bufferView.setUint8(1, SC_SUB_MESSAGE);

        //Set the message length
        //TODO: Verify that the number being passed below is pointing at the 'checksum high' slot
        bufferView.setUint8(2, returnBuffer.byteLength - 1);

        //Set the destination UID
        var destArray = UID.getDataBlock(destUID);
        var destView = new DataView(destArray);
        for (i = 0; i <= 5; i++) {
            bufferView.setUint8(i + 3, destView.getUint8(i));
        }

        //Set the source UID
        var srcArray = UID.getDataBlock(srcUID);
        var srcView = new DataView(srcArray);
        for (i = 0; i <= 5; i++) {
            bufferView.setUint8(i + 9, srcView.getUint8(i));
        }

        //Set the transaction number
        bufferView.setUint8(15, transactNum);

        //Set the port ID
        bufferView.setUint8(16, port);

        //Set the message count
        bufferView.setUint8(17, msgCount);

        //Set the sub-device field
        bufferView.setUint16(18, subDevice, false);

        //Set the command class
        bufferView.setUint8(20, cmdClass);

        //Set the parameter ID
        bufferView.setUint16(21, paramID, false);

        //Set the parameter data length
        bufferView.setUint8(23, paramData.byteLength);

        //Set the parameter data
        var paramView = new DataView(paramData);
        //TODO: Make sure that 'paramData.byteLength' grabs every value in the passed ArrayBuffer object and does not go out of bounds
        for (i = 0; i <= paramData.byteLength; i++) {
            bufferView.setUint8(i + 24, paramView.getUint8(i));
        }

        //Calculate and set the checksum here
        var checksum = 0;
        for (i = 0; i <= paramData.byteLength + 22; i++) {
            checksum += bufferView.getUint8(i);
        }
        bufferView.setUint16(paramData.byteLength + 20, checksum, false);

        return returnBuffer;
    }

    getGetCommunicationStatusMessage(destUID, srcUID, transactNum, port) {
        return RDMPacket.getBinaryString(destUID, srcUID, transactNum, port, 0, 0, CommandClass.GET_COMMAND, ParameterID.COMMS_STATUS, new ArrayBuffer(0));
    }

    getGetSupportedParametersMessage(destUID, srcUID, transactNum, port, subDevice) {
        return RDMPacket.getBinaryString(destUID, srcUID, transactNum, port, 0, subDevice, CommandClass.GET_COMMAND, ParameterID.SUPPORTED_PARAMETERS, new ArrayBuffer(0));
    }
}

//Represents an auto-incrementing number used in the 'Transaction Number' field of an RDM packet (controllers are required to auto-increment this number per specification)
class TransactionNumber {
    constructor(number) { this.number = number ?? 0; }
    getNumber(increment) {
        increment = increment ?? true;
        var returnNumber = this.number;
        if (increment) { this.number = (this.number + 1) % 256; }
        return returnNumber;
    }
}

//Static class for formatting & validating RDM UIDs
class UID {

    //First use regex to remove unwanted characters
    //Second, convert all letters to upper case
    //Third, pad with zeros at beginning to create a 12-digit (hex) value
    //Fourth, only take the first twelve characters in the string in case more are supplied
    static formatString(uidString) { return uidString.match(RE_HEX_DIGITS).join("").toUpperCase().padStart(12, "0").slice(0, 12); }

    //Returns a specified UID in binary format (ArrayBuffer); used to assemble an outbound RDM packet
    static getDataBlock(uidString) {
        //First properly format the provided string
        uidString = UID.formatString(uidString);

        //Create an ArrayBuffer object that will return the supplied UID in binary format
        var returnBuffer = new ArrayBuffer(6);

        //Make a DataView object that encompasses the entire length of the ArrayBuffer
        var view = DataView(returnBuffer);

        //Loop through each pair of hexadecimal digits in the string and set each one as the unsigned 8-bit integer in the return array
        //TODO: Perform QA on this individual loop for correct syntax and array bounds
        uidString.match(/.{2}/g).forEach((byte, byteIndex) => {
            view.setUint8(byteIndex, parseInt(byte, 16));
        });

        return returnBuffer;
    }

    //Returns the manufacturer-specified broadcast UID
    static getDeviceBroadcastUIDString(manufacturerID) { return `${manufacturerID}FFFFFFFF`; }

    //Returns parameter data for discovery unique branch messages (RDM discovery messages that have a specified UID range)
    static getDiscoveryUniqueBranchParameterData(lowerBoundUID, upperBoundUID) {
        //First properly format the supplied UIDs
        lowerBoundUID = UID.formatString(lowerBoundUID);
        upperBoundUID = UID.formatString(upperBoundUID);

        //Next, create the return array buffer that will start with the lower bound UID and end with the upper bound UID and necessary DataView to modify accordingly
        var returnBuffer = new ArrayBuffer(12);
        var view = DataView(returnBuffer);

        //Combine the two UID strings and iterate over each pair of characters that represent a single byte, and add the the return ArrayBuffer accordingly
        (lowerBoundUID + upperBoundUID).match(/.{2}/g).forEach((byte, byteIndex) => {
            view.setUint8(byteIndex, parseInt(byte, 16));
        });

        return returnBuffer;
    }
}

//End RDM code block