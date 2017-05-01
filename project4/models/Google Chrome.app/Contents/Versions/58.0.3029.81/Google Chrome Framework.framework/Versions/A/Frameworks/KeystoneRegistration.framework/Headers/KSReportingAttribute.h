// Copyright 2014 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import <Cocoa/Cocoa.h>

// Reporting attributes allow Keystone managed applications to pass simple usage
// data to the update server during the update pings. A good example is the number
// of signed in users. The application may specify an unsigned attribute with name
// "numSigned" and set it to 1 to indicate the presence of 1 signed in user.
// The application may also specify for how long Keystone should keep reporting
// this value. E.g. Chrome may want to keep this attribute for 28 days (default lifetime).
// The clock starts ticking when the attribute is created (see expirationDate_ field).
// Keystone will be sending the attribute with the update checks for the next 28 days.
// If the user doesn't run Chrome for more than 28 days, Chrome will not update this
// attribute. After the 28 day lifetime expires, Keystone will stop reporting this
// attribute when sending an update check ping.
// In addition to the expiration, system Keystone may build ability to support
// aggregation of the values across multiple users, so that the total value for
// the machine is reported. This ability works only if the Keystone ticket is
// system-level and not user-level.
//
// Sample usage:
// KSRegistration *reg = ...;
// KSError *error = nil;
// KSUnsignedReportingAttribute *attr =
//     [KSUnsignedReportingAttribute reportingAttributeWithValue:numProfiles
//                                                          name:@"numProfiles"
//                                               aggregationType:kKSReportingAggregationSum
//                                                         error:&error];
// if (attr) {
//   [reg setActiveWithReportingAttributes:@[ attr ]
//                                   error:&error];
// }

/**
 * Supported aggregation methods. Used in the system Keystone to calculate the
 * reporting attribute value, when the value is reported by multiple users.
 * E.g. if "sum" is used, the values are simply added. Summation is suitable for
 * numerable values like "number of ...", but not for proprotional ones like
 * "percent of profiles signed in during the last session". Note that this enum is
 * leveraged only if the reporting attribute type supports aggregation. E.g.
 * KSStringReportingAttribute does not.
 */
typedef enum {
  kKSReportingAggregationSum = 0,  // Adds attribute value across user accounts
  kKSReportingAggregationDefault = kKSReportingAggregationSum,
} KSReportingAggregationType;

/**
 * Holds generic reporting attribute properties. The class is not thread-safe.
 * See the header file comments for full usage details.
 */
@interface KSReportingAttribute : NSObject {
 @protected
  /**
   * The name of the reporting attribute. Should be alphanumeric
   * with no white space. May contain '_'.
   * @see setName
   */
  NSString *_name;

  /**
   * Holds the value of the attribute.
   */
  id<NSObject, NSCopying> _value;

  /**
   * The point of time when the attribute will expire and the update engine will
   * stop reporting it to update server.
   */
  NSDate *_expirationDate;

  /**
   * In the case of system ticket, this value controls the way in which the
   * attribute values are going to be aggregated.
   */
  KSReportingAggregationType _aggregationType;
}

/**
 * Serializes the attributes to a dictionary. Used when storing as plist.
 *
 * @param attributes An array with KSReportingAttribute objects.
 * @param error Standard error parameter.
 *
 * @return A dictionary with the contents of the attributes as primitive objects,
 * keyed by attribute name. In case of error, the method
 * returns @c nil and passes back the error via @c error, if @c error is not nil.
 */
+ (NSMutableDictionary *)dictionaryWithReportingAttributes:(NSArray *)attributes
                                                     error:(NSError **)error;

/**
 * Persists the reporting attributes.
 *
 * @param attributes An array with KSReportingAttribute objects.
 * @param filePath The destination file, where the attributes will be stored.
 * @param error Standard error parameter.
 *
 * @return YES on success. In case of failure, NO is returned. @c error is leveraged
 * in this case to pass back the error object, unless @c error is nil.
 */
+ (BOOL)saveReportingAttributes:(NSArray *)attributes
                         toFile:(NSString *)filePath
                          error:(NSError **)error;

/**
 * Reads the attributes from a file. Expired attributes are ignored.
 *
 * @param filePath The file containinging reporting attributes.
 * @param error Standard error parameter.
 *
 * @return An array, containing the loaded KSReportingAttribute instances. In case of error,
 * the method returns @c nil. @c error is leveraged in this case to pass back the error object,
 * unless @c error is nil.
 */
+ (NSArray *)reportingAttributesFromFile:(NSString *)filePath error:(NSError **)error;

/**
 * Given a dictionary with the contents of attributes, the method instantiates and initializes the
 * attributes.
 *
 * @param attributesContents the contents of the attributes as primitive types (plist ones).
 * @param error Standard error parameter.
 *
 * @return An array with the KSReportingAttribute objects. In case of error, the method
 * returns @c nil. @c error is leveraged in this case to pass back the error object,
 * unless @c error is nil.
 */
+ (NSMutableArray *)reportingAttributesFromDictionary:(NSDictionary *)attributesContents
                                                error:(NSError **)error;

/**
 * @return The amount of time the attribute will continue to be reported. Calculated as delta
 * between the current date/time and the expiration date.
 * @see setLifetime
 */
@property(readonly) NSTimeInterval lifetime;

/**
 * Sets the amount of time the attribute will continue to be reported. The clock starts ticking
 * as soon as this method is called. This method updates the expiration date accordingly.
 *
 * @param lifetime The new lifetime of the attribute in seconds.
 * @param error Standard error parameter.
 *
 * @return YES on success. The method checks if the lifetime is negative or so short
 * that the attribute would expire by the time update engine picks it up. In these error cases,
 * the method returns NO and sets @c error, if @c error is not nil.
 */
- (BOOL)setLifetime:(NSTimeInterval)lifetime error:(NSError **)error;

/**
 * The exact point of time when the attribute will expire and update engine will stop
 * reporting it to the update server.
 */
@property(readonly) NSDate *expirationDate;

/**
 * Sets exact point of time when the attribute will expire and update engine will stop
 * reporting it to the update server.
 *
 * @param date The expiration date.
 * @param error Standard error parameter.
 *
 * @return YES on success. The method does strict verifications of the date objects, including
 * the class of the object. The method checks if the expiration date is in the past or so short
 * future that attribute would expire by the time update engine picks it up. In all error cases,
 * the method returns NO and sets @c error, if @c error is not nil.
 */
- (BOOL)setExpirationDate:(NSDate *)date error:(NSError **)error;

/**
 * @return The value stored, as a generic NSObject. Derived classes'
 * accessors provide a more specific data type.
 */
@property(readonly) id<NSObject, NSCopying> value;

/**
 * @return The value of the attribute as a string. The default implementation uses the
 * @c "description" selector of the value object. Derived classes may extend it to provide a more
 * human readable form (yet it needs to be XML parsable). Used by the KSReportingAttribute's
 * @c "description" implementation and when passing the attribute value in the XML payload to
 * the update server.
 */
@property(readonly) NSString *stringValue;

/**
 * @return The name of the attribute.
 * @see setName
 */
@property(readonly) NSString *name;

/**
 * Sets the name of the attribute. @c -setName checks that the name starts with a letter or '_'
 * and contains only Latin letters, digits, '_' and '-'. If the attribute name does not
 * start with underscore, the name will be prefixed with underscore by this method. This
 * ensures that the attributes do not collide with important pre-set attributes like "version"
 * or "OS". The name is case-insensitive and is stored as lowercase.
 *
 * @param name The new name of the attribute.
 * @param error Standard error parameter.
 *
 * @return YES on success. In case the name does not comply with the standards, the method
 * returns NO and sets @c error, if @c error is not nil.
 */
- (BOOL)setName:(NSString *)name error:(NSError **)error;

/**
 * Verifies that the name passes requirements. Typically called by setName and helper methods.
 *
 * @param name The attribute name to verify.
 * @param error Standard error parameter.
 *
 * @return YES if the name is correct or NO, if it contains wrong symbols or doesn't pass the
 * length requirements. @c error is assigned appropriately if @c error is not nil and the verification
 * fails.
 * @see setName
 */
+ (BOOL)verifyAttributeName:(NSString *)name error:(NSError **)error;

/**
 * Extracts a single reporting attribute with the specified name, using the @c attributeContents
 * for reading the attribute contents.
 *
 * @param name The name of the attribute to extract.
 * @param attributeContents Dictionary with dictionaries, holding the attribute contents. First
 * keyed by the attribute name. The inner dictionary contains the different attribute properties
 * like value, aggregation type, expiration date.
 * @param error Standard error parameter.
 *
 * @return Reporting attribute object initialized with the contents of the @c attributeConents, and
 * using the specified @c name. In case of error, the method returns @c nil and if @c error is 
 * not nil, the method sets it accordingly.
 */
+ (KSReportingAttribute *)extractReportingAttributeWithName:(NSString *)name
                                                   contents:(NSDictionary *)attributeContents
                                                      error:(NSError **)error;

/**
 * Extracts the data of the attribute without the attribute name. Used during serialization.
 *
 * @param error Standard error parameter.
 *
 * @return A dictionary with the contents of the attribute. In case of error, the method returns
 * nil and if @c error is not nil, the method sets it accordingly.
 */
- (NSDictionary *)contentsWithError:(NSError **)error;

/**
 * Aggregates the values across multiple attributes. Generates a single aggregated attribute
 * to hold the value on success. Returns @c nil if the @c attributes is nil or empty. If the
 * attribute type does not support aggregation, the first attribute is returned. This behavior
 * is used by the update engine to ensure that the first attribute is the one for the current
 * user. Thus, if the system Keystone is engaged and the non-aggregatable attribute is reported
 * by multiple users, only the current user attribute will be reported to the update server.
 *
 * @param attributes An array of attributes which value to aggregate.
 * @param error Standard error parameter.
 *
 * @return A single attribute, holding the aggregated value. In case of error, the method returns
 * nil and if @c error is not nil, the method sets it appropriately.
 */
+ (KSReportingAttribute *)aggregatedAttributeWithAttributes:(NSArray *)attributes
                                                      error:(NSError **)error;

@end

/*
 * The class holds a single custom reporting attribute of type unsigned integer
 * that the application would like to pass during the update check ping.
 */
@interface KSUnsignedReportingAttribute : KSReportingAttribute

/**
 * Creates unsigned reporting attribute using the default lifetime.
 *
 * @param value The value of the attribute.
 * @param name The name of the attribute.
 * @param aggregationType In the case of system update engine, attribute values are aggregated
 * between users and reported once for the whole machine. This parameter controls the aggregation
 * mechinism.
 * @see KSReportingAggregationType
 * @param error Standard error parameter.
 *
 * @return Reporting attribute object, holding the specified integer value and initialized with
 * the specified properties (name, aggregation type, etc.). In case of error, the method returns
 * nil and if @c error is not nil, the method sets it accordingly.
 */
+ (instancetype)reportingAttributeWithValue:(uint32_t)value
                                       name:(NSString *)name
                            aggregationType:(KSReportingAggregationType)aggregationType
                                      error:(NSError **)error;

/**
 * Creates unsigned reporting attribute with the specified lifetime
 * as an interval since now.
 *
 * @param value the value of the attribute.
 * @param name the name of the attribute.
 * @param aggregationType In the case of system update engine, attribute values are aggregated
 * between users and reported once for the whole machine. This parameter controls the aggregation
 * mechinism.
 * @see KSReportingAggregationType
 * @param lifetime The lifetime of the attribute.
 * @param error Standard error parameter.
 *
 * @return Reporting attribute object, holding the specified integer value and initialized with
 * the specified properties (name, aggregation type, etc.). In case of error, the method returns
 * nil and if @c error is not nil, the method sets it accordingly.
 */
+ (instancetype)reportingAttributeWithValue:(uint32_t)value
                                       name:(NSString *)name
                            aggregationType:(KSReportingAggregationType)aggregationType
                                   lifetime:(NSTimeInterval)lifetime
                                      error:(NSError **)error;

/**
 * Creates unsigned reporting attribute with an explicit expiration date.
 *
 * @param value the value of the attribute.
 * @param name the name of the attribute.
 * @param aggregationType In the case of system update engine, attribute values are aggregated
 * between users and reported once for the whole machine. This parameter controls the aggregation
 * mechinism.
 * @see KSReportingAggregationType
 * @param expirationDate The point of time when the attribute will expire.
 * @param error Standard error parameter.
 *
 * @return Reporting attribute object, holding the specified integer value and initialized with
 * the specified properties (name, aggregation type, etc.). In case of error, the method returns
 * nil and if @c error is not nil, the method sets it accordingly.
 */
+ (instancetype)reportingAttributeWithValue:(uint32_t)value
                                       name:(NSString *)name
                            aggregationType:(KSReportingAggregationType)aggregationType
                             expirationDate:(NSDate *)expirationDate
                                      error:(NSError **)error;

/**
 * The value of the attribute as "unsigned int".
 */
@property(assign) uint32_t unsignedIntValue;

/**
 * The type of the attribute value aggregation.
 * @see KSReportingAggregationType
 */
@property(assign) KSReportingAggregationType aggregationType;

@end

/*
 * The class holds a single custom reporting attribute of type string
 * that the application would like to pass during the update check ping.
 */
@interface KSStringReportingAttribute : KSReportingAttribute

/**
 * Creates string reporting attribute using the default lifetime.
 *
 * @param value The value of the attribute.
 * @param name The name of the attribute.
 * @see KSReportingAggregationType
 * @param error Standard error parameter.
 *
 * @return Reporting attribute object, holding the specified string and initialized with the
 * specified name. In case of error, the method returns nil and if @c error is not nil, the
 * method sets it accordingly.
 */
+ (instancetype)reportingAttributeWithValue:(NSString *)value
                                       name:(NSString *)name
                                      error:(NSError **)error;

/**
 * Creates string reporting attribute with the specified lifetime
 * as an interval since now.
 *
 * @param value the value of the attribute.
 * @param name the name of the attribute.
 * @param lifetime The lifetime of the attribute.
 * @param error Standard error parameter.
 *
 * @return Reporting attribute object, holding the specified string and initialized with the
 * specified name and lifetime. In case of error, the method returns nil and if @c error is 
 * not nil, the method sets it accordingly.
 */
+ (instancetype)reportingAttributeWithValue:(NSString *)value
                                       name:(NSString *)name
                                   lifetime:(NSTimeInterval)lifetime
                                      error:(NSError **)error;

/**
 * Creates string reporting attribute with an explicit expiration date.
 *
 * @param value the value of the attribute.
 * @param name the name of the attribute.
 * @param expirationDate The point of time when the attribute will expire.
 * @param error Standard error parameter.
 *
 * @return Reporting attribute object, holding the specified string and initialized with the
 * specified name and expirationDate. In case of error, the method returns nil and if @c error
 * is not nil, the method sets it accordingly.
 */
+ (instancetype)reportingAttributeWithValue:(NSString *)value
                                       name:(NSString *)name
                             expirationDate:(NSDate *)expirationDate
                                      error:(NSError **)error;

/**
 * Sets the value of the attribute as NSString instance.
 *
 * @param value The new value of the attribute.
 */
- (BOOL)setStringValue:(NSString *)value error:(NSError **)error;

@end


/*
 * The class holds multiple reporting attributes, each of which has separate expiration time and
 * name/value. The elements are reported as a single attribute. Used for experiment labels. This
 * class generates the value as a string aggregate of the inner attributes in the form
 * "name1=stringValue1;name2=stringValue2;..."
 * Composite attributes cannot contain other composite attributes (no deep nesting of attributes).
 */
@interface KSCompositeReportingAttribute : KSReportingAttribute

/*
 * Factory creator for the object.
 * @param innerAttributes The embedded attributes
 * @param name The name of this composite attribute.
 * @param error Standard error parameter.
 * @return the new composite attribute or nil in case of error.
 */
+ (instancetype)compositeAttributeWithAttributes:(NSArray *)innerAttributes
                                            name:(NSString *)name
                                           error:(NSError **)error;

/*
 * Initializes the object with the provided inner attributes.
 * @param innerAttributes The embedded attributes
 * @param name The name of this composite attribute.
 * @param error Standard error parameter.
 * @return the new composite attribute or nil in case of error.
 */
- (instancetype)initWithAttributes:(NSArray *)innerAttributes
                              name:(NSString *)name
                             error:(NSError **)error;

@property(readonly, copy) NSDictionary *innerAttributes;

/*
 * Allows for objective-c subscripting on the attribute, e.g.
 *   KSCompositeReportingAttribute *composite = [self extractTheAttribute];
 *   KSReportingAttribute *myLabel = composite[@"mylabel"];
 * @param name The name of this inner attribute to return. The name should be without the leading
 *             '_', appended to the attribute names.
 * @return The inner attribute with the specified name or nil, if such inner attribute
 * does not exist.
 */
- (KSReportingAttribute *)objectForKeyedSubscript:(NSString *)name;

/*
 * Adds the specified attribute. If attribute with this name already exists, it will be overridden.
 */
- (BOOL)addInnerAttribute:(KSReportingAttribute *)newAttribute error:(NSError **)error;

/*
 * Removes the specified attribute. The method is a no-op, if the attribute does not exist.
 * @param name The name of this inner attribute to return. The name should be without the leading
 *             '_', appended to the attribute names.
 */
- (void)removeInnerAttribute:(NSString *)name;

@end


/*
 * Implements experiment labels in a single attribute. Builds on top of
 * KSCompositeReportingAttribute by providing stronger content checks and setting the proper name of
 * the attribute.
 */
@interface KSExperimentLabelsAttribute : KSCompositeReportingAttribute

/*
 * Update engine used to support a single experiment label, represented as a string attribute with
 * value of "<label>=<value>". This method extracts the experiment from such attribute and creates
 * a new KSExperimentLabelsAttribute object with it.
 * @param experimentLabel The legacy experiment label.
 * @param error Standard error parameter.
 * @return the new composite attribute or nil in case of error.
 */
+ (instancetype)experimentLabelsLegacyExperiments:(KSStringReportingAttribute *)experimentLabel
                                            error:(NSError **)error;

/*
 * Creates the experiment labels attribute with the specified experiments, defined as
 * KSReportingAttribute objects.
 * @param experimentLabels An array of KSStringReportingAttribute objects, specifying the
                           experiments.
 * @param error Standard error parameter.
 * @return the new composite attribute or nil in case of error.
 */
+ (instancetype)experimentLabelsWithAttributes:(NSArray *)experimentLabels
                                         error:(NSError **)error;

/*
 * Initializes the experiment labels attribute with the specified experiments, defined as
 * KSReportingAttribute objects.
 * @param experimentLabels An array of KSReportingAttribute objects, specifying the experiments.
 * @param error Standard error parameter.
 * @return the new composite attribute or nil in case of error.
 */
- (instancetype)initWithAttributes:(NSArray *)experimentLabels
                             error:(NSError **)error;

/**
 * The special name of the experiment labels. Prefix with '_' is not enforced for that name by the
 * update engine.
 */
+ (NSString *)experimentsAttributeName;

/**
 * Returns the current date in 'YYYYWW' format and UTC time. 'WW' is the week of the year with
 * Jan 1st as the first day of the week 01. Jan 7th is the last day of week 01. This is more
 * predictable than the different standards for "week of the year", used by different utilities
 * (Possix.2, ISO-8601). In case of error, we write year 0 and week 0.
 * Used in experiment labels to denote event times with low time granularity.
 */
+ (NSString *)currentWeekAndYear;

@end

